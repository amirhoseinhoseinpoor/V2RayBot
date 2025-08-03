import { connectSSH, ssh } from "../ssh/sshClient.js";
import { collectHourlyTraffic } from "../../cron/collectHourlyTraffic.js";
import dotenv from "dotenv";
dotenv.config();

export async function getAllTrafficStats(): Promise<string> {
  await connectSSH();

  const cmd = `/usr/bin/v2ray api stats --server=127.0.0.1:32889`;
  const result = await ssh.execCommand(cmd);

  if (result.stderr) {
    console.error("❌ Error running V2Ray stats command:", result.stderr);
    throw new Error(result.stderr);
  }

  return result.stdout;
}

export async function getUserTraffic(email: string): Promise<{ uplink: number; downlink: number }> {
  await connectSSH();
  const command = `/usr/bin/v2ray api stats --server=127.0.0.1:${process.env.V2RAY_API_PORT} "user>>>${email}"`;

  const result = await ssh.execCommand(command);

  const output = result.stdout || "";
  const uplink = parseTraffic(output, "uplink");
  const downlink = parseTraffic(output, "downlink");

  return { uplink, downlink };
}

export async function resetV2RayStats(): Promise<void> {
  await connectSSH();
  const command = `/usr/bin/v2ray api stats --server=127.0.0.1:${process.env.V2RAY_API_PORT} --reset`;

  const result = await ssh.execCommand(command);

  if (result.stderr) {
    console.error("Error resetting V2Ray stats:", result.stderr);
    throw new Error(result.stderr);
  }

  console.log("✅ V2Ray stats reset successfully.");
}

export async function deleteV2RayUser({ email }: { email: string }): Promise<boolean> {
  const configPath = "/usr/local/etc/v2ray/config.json";
  let tmpConfigPath = "";

  try {
    await ssh.connect({
      host: process.env.VPS_HOST!,
      username: "root",
      password: process.env.VPS_PASSWORD!,
    });

    // 1. Read the current config from VPS
    const catResult = await ssh.execCommand(`cat ${configPath}`);
    if (catResult.code !== 0 || !catResult.stdout) {
      throw new Error("Failed to read V2Ray config: " + catResult.stderr);
    }

    collectHourlyTraffic();

    const config = JSON.parse(catResult.stdout);

    // 2. Find VMess inbound (by tag or protocol)
    const inboundIndex = config.inbounds.findIndex(
      (i: any) => i.tag === "vmess-in" || i.protocol === "vmess"
    );
    if (inboundIndex === -1) {
      throw new Error("VMess inbound not found in config.");
    }

    const clients = config.inbounds[inboundIndex].settings.clients;

    // 3. Remove the user by email
    const newClients = clients.filter((c: any) => c.email !== email);
    if (newClients.length === clients.length) {
      console.warn(`⚠️ User not found in config: ${email}`);
      return false;
    }

    config.inbounds[inboundIndex].settings.clients = newClients;

    // 4. Save updated config to temp file
    tmpConfigPath = `/tmp/v2ray-config-${Date.now()}.json`;
    await ssh.execCommand(`echo '${JSON.stringify(config)}' > ${tmpConfigPath}`);

    // 5. Validate new config
    const validation = await ssh.execCommand(`/usr/bin/v2ray test -config ${tmpConfigPath}`);
    if (validation.code !== 0) {
      throw new Error(`❌ Config validation failed: ${validation.stderr}`);
    }

    // 6. Apply new config and restart V2Ray
    await ssh.execCommand(`sudo mv ${tmpConfigPath} ${configPath}`);
    await ssh.execCommand("sudo systemctl restart v2ray");

    console.log(`✅ User ${email} removed and V2Ray restarted.`);
    return true;
  } catch (err) {
    console.error("❌ Failed to delete V2Ray user:", err);
    return false;
  } finally {
    // Clean up temp file if needed
    if (tmpConfigPath) {
      await ssh.execCommand(`rm -f ${tmpConfigPath}`);
    }
  }
}



// Helper parser
function parseTraffic(output: string, type: "uplink" | "downlink"): number {
  const regex = new RegExp(`([\\d.]+)([KMG]?B)\\s+user.*traffic>>>${type}`);
  const match = output.match(regex);

  // Extra safety: ensure capturing groups exist
  if (!match || !match[1] || !match[2]) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2];

  switch (unit) {
    case "KB": return value * 1024;
    case "MB": return value * 1024 * 1024;
    case "GB": return value * 1024 * 1024 * 1024;
    default: return value;
  }
}

// // A simple parser if v2ray outputs plain byte value
// function parseTraffic(output: string): number {
//   return parseInt(output.trim());
// }