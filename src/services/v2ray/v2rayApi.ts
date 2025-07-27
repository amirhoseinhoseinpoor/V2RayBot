import { connectSSH, ssh } from "../ssh/sshClient.js";
import dotenv from "dotenv";
dotenv.config();

export async function getAllTrafficStats(): Promise<string> {
  await connectSSH();

  const cmd = process.env.V2RAY_STATS_COMMAND!;
  const result = await ssh.execCommand(cmd);

  if (result.stderr) {
    console.error("❌ Error running V2Ray stats command:", result.stderr);
    throw new Error(result.stderr);
  }

  return result.stdout;
}

export async function getUserTraffic(email: string): Promise<{ uplink: number; downlink: number }> {
  await connectSSH();
  const command = `/usr/bin/v2ray api stats --server=127.0.0.1:${process.env.V2RAY_API_PORT} --name user>>>${email}`;

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

export async function deleteV2RayUser({
  id,
  alterId,
  email,
}: {
  id: string;
  alterId: number;
  email: string;
}): Promise<boolean> {
  try {
    await connectSSH();

    const command = `/usr/bin/v2ray api config --server=127.0.0.1:${process.env.V2RAY_API_PORT} --remove --user ${email}`;
    const result = await ssh.execCommand(command);

    if (result.stderr) {
      console.error("Error deleting V2Ray user:", result.stderr);
      return false;
    }

    console.log(`✅ Deleted V2Ray user: ${email}`);
    return true;

  } catch (err) {
    console.error("❌ SSH Error during deleteV2RayUser:", err);
    return false;
  }
}



// Helper parser
function parseTraffic(output: string, type: "uplink" | "downlink"): number {
  const regex = new RegExp(`traffic>>>${type}\\s*=\\s*(\\d+)`);
  const match = output.match(regex);
  return match ? Number(match[1]) : 0;
}

// // A simple parser if v2ray outputs plain byte value
// function parseTraffic(output: string): number {
//   return parseInt(output.trim());
// }