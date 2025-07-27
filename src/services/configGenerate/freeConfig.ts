import { v4 as uuidv4 } from "uuid";
import { ssh, connectSSH } from "../ssh/sshClient.js";

export async function generateFreeAccountConfig(userId: string) {
  await connectSSH();

  const uuid = uuidv4();
  const alterId = 0; // usually 0 for VLESS, optional for VMess
  const email = `free-${userId}@vpn.test`; // Unique email per user
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const formattedExpiry = expiry.toISOString();

  // 🛠️ Add user via V2Ray API
  const addCommand = `/usr/bin/v2ray api config --server=127.0.0.1:${process.env.V2RAY_API_PORT} --add --inbound-tag=vmess-in --client '{"id":"${uuid}","alterId":${alterId},"email":"${email}"}'`;

  const result = await ssh.execCommand(addCommand);

  if (result.stderr) {
    console.error("❌ Failed to add V2Ray user:", result.stderr);
    throw new Error("V2Ray user creation failed");
  }

  // ✅ Return config string & metadata
  const config = `vmess://${Buffer.from(
    JSON.stringify({
      v: "2",
      ps: "FreeAccount",
      add: process.env.VPS_HOST,
      port: "32889",
      id: uuid,
      aid: alterId,
      net: "tcp",
      type: "none",
      host: "",
      path: "",
      tls: "none",
    })
  ).toString("base64")}`;

  return {
    config,
    uuid,
    email,
    alterId,
  };
}
