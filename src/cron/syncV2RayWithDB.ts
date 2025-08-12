import { prisma } from "../db/index.js";
import { NodeSSH } from "node-ssh";

const ssh = new NodeSSH();

export async function syncV2RayWithDB() {
  let tmpConfigPath = "";

  try {
    // 1. Connect to server
    await ssh.connect({
      host: process.env.VPS_HOST!,
      username: "root",
      password: process.env.VPS_PASSWORD!,
    });

    // 2. Read V2Ray config
    const configPath = "/usr/local/etc/v2ray/config.json";
    const catResult = await ssh.execCommand(`cat ${configPath}`);
    if (catResult.code !== 0 || !catResult.stdout) {
      throw new Error("Failed to read V2Ray config: " + catResult.stderr);
    }
    const config = JSON.parse(catResult.stdout);

    // 3. Get inbound index
    const inboundIndex = config.inbounds.findIndex(
      (i: any) => i.tag === "vmess-in" || i.protocol === "vmess"
    );
    if (inboundIndex === -1) throw new Error("VMess inbound not found");

    const clients = config.inbounds[inboundIndex].settings.clients;

    // 4. Get VPN list from DB
    const dbVPNs = await prisma.vPN.findMany({
      where: { expired: false },
      select: { id: true, email: true, trafficLimit: true, uuid: true },
    });

    // 5. Convert for easy lookup
    const dbEmails = new Set(dbVPNs.map((v) => v.email));
    const v2rayEmails = new Set(clients.map((c: any) => c.email));

    // 6. Remove clients not in DB
    const filteredClients = clients.filter((c: any) => dbEmails.has(c.email));

    // 7. Add missing DB VPNs to V2Ray
    for (const vpn of dbVPNs) {
      if (!v2rayEmails.has(vpn.email)) {
        const newClient: any = {
          id: vpn.uuid,
          alterId: 0,
          security: "auto",
          email: vpn.email,
        };
        if (vpn.trafficLimit) {
          const limitNum = Number(vpn.trafficLimit);
          newClient.total = limitNum * 1024 * 1024 * 1024;
        }
        filteredClients.push(newClient);
      }
    }

    // 8. Replace clients array
    config.inbounds[inboundIndex].settings.clients = filteredClients;

    // 9. Save new config to temp file
    tmpConfigPath = `/tmp/v2ray-config-${Date.now()}.json`;
    await ssh.execCommand(
      `echo '${JSON.stringify(config)}' > ${tmpConfigPath}`
    );

    // 10. Validate config
    const validation = await ssh.execCommand(
      `/usr/bin/v2ray test -config ${tmpConfigPath}`
    );
    if (validation.code !== 0) {
      throw new Error(`Config validation failed: ${validation.stderr}`);
    }

    // 11. Move new config into place
    await ssh.execCommand(`mv ${tmpConfigPath} ${configPath}`);

    // If running as a systemd service:
    const reloadResult = await ssh.execCommand(`systemctl reload v2ray`);
    if (reloadResult.code !== 0) {
      // fallback to restart if reload not supported
      await ssh.execCommand(`systemctl restart v2ray`);
    }

    console.log("✅ V2Ray config synced and reloaded.");
  } catch (err) {
    console.error("❌ V2Ray sync error:", err);
  } finally {
    if (tmpConfigPath) {
      await ssh.execCommand(`rm -f ${tmpConfigPath}`);
    }
    if (ssh.isConnected()) ssh.dispose();
  }
}
