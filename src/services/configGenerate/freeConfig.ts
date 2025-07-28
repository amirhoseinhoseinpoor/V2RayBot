import { NodeSSH } from "node-ssh";
import { v4 as uuidv4 } from "uuid";
import { collectHourlyTraffic } from "../../cron/collectHourlyTraffic.js";

const ssh = new NodeSSH();

interface V2RayUser {
    id: string;
    alterId: number;
    security: string;
    email: string;
}

interface VMessConfig {
    v: string;
    ps: string;
    add: string;
    port: string;
    id: string;
    aid: number;
    net: string;
    type: string;
    host: string;
    path: string;
    tls: string;
    scy: string;
}

export async function generateFreeAccountConfig(telegramId: bigint): Promise<{
    config: string;
    uuid: string;
    email: string;
    alterId: number;
}> {
    const uuid = uuidv4();
    const email = `free-${telegramId}@vpn.test`;
    const userObject: V2RayUser = {
        id: uuid,
        alterId: 0,
        security: "auto",
        email,
    };

    let tmpConfigPath = '';
    
    try {

        await collectHourlyTraffic()
        // Connect to server via SSH
        await ssh.connect({
            host: process.env.VPS_HOST!,
            username: "root",
            password: process.env.VPS_PASSWORD!,
        });

        // 1. Read config directly from VPS
        const configPath = "/usr/local/etc/v2ray/config.json";
        const catResult = await ssh.execCommand(`cat ${configPath}`);
        if (catResult.code !== 0 || !catResult.stdout) {
            throw new Error("Failed to read V2Ray config: " + catResult.stderr);
        }

        const config = JSON.parse(catResult.stdout);

        // 2. Find the correct inbound
        const inboundIndex = config.inbounds.findIndex(
            (i: any) => i.tag === "vmess-in" || i.protocol === "vmess"
        );
        if (inboundIndex === -1) throw new Error("VMess inbound not found");

        // 3. Add new user
        config.inbounds[inboundIndex].settings.clients.push({
            id: userObject.id,
            alterId: userObject.alterId,
            email: userObject.email,
            security: userObject.security,
        });

        // 4. Create temporary config on VPS
        tmpConfigPath = `/tmp/v2ray-config-${Date.now()}.json`;
        await ssh.execCommand(`echo '${JSON.stringify(config)}' > ${tmpConfigPath}`);

        // 5. Validate config
        const validation = await ssh.execCommand(`/usr/bin/v2ray test -config ${tmpConfigPath}`);
        if (validation.code !== 0) {
            throw new Error(`Config validation failed: ${validation.stderr}`);
        }

        // 6. Replace live config and restart V2Ray
        await ssh.execCommand(`sudo mv ${tmpConfigPath} ${configPath}`);
        await ssh.execCommand("sudo systemctl restart v2ray");
        tmpConfigPath = ''; // Clear temp path after successful move

        // 7. Get actual port from config
        const port = config.inbounds[inboundIndex].port.toString();

        // Generate VMess URL
        const vmess: VMessConfig = {
            v: "2",
            ps: "FreeAccount",
            add: process.env.VPS_HOST!,
            port: port,
            id: userObject.id,
            aid: userObject.alterId,
            net: config.inbounds[inboundIndex].streamSettings?.network || "tcp",
            type: config.inbounds[inboundIndex].streamSettings?.tcpSettings?.header?.type || "none",
            host: config.inbounds[inboundIndex].streamSettings?.tlsSettings?.serverName || "",
            path: config.inbounds[inboundIndex].streamSettings?.wsSettings?.path || "",
            tls: config.inbounds[inboundIndex].streamSettings?.security || "none",
            scy: "auto",
        };

        return {
            config: `vmess://${Buffer.from(JSON.stringify(vmess)).toString("base64")}`,
            uuid: userObject.id,
            email: userObject.email,
            alterId: userObject.alterId,
        };
    } catch (error) {
        console.error("V2Ray config error:", error);
        throw error;
    } finally {
        // Cleanup temp file on VPS if it exists
        if (tmpConfigPath) {
            try {
                await ssh.execCommand(`rm -f ${tmpConfigPath}`);
            } catch (cleanupError) {
                console.error("Temp file cleanup failed:", cleanupError);
            }
        }
        if (ssh.isConnected()) {
            ssh.dispose();
        }
    }
}