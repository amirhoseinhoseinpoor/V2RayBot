import { NodeSSH } from "node-ssh";
import dotenv from "dotenv";
dotenv.config();

export const ssh = new NodeSSH();

export async function connectSSH() {
  if (ssh.isConnected()) return; // avoid reconnecting if already connected

  await ssh.connect({
    host: process.env.VPS_HOST!,
    username: process.env.VPS_USER!,
    privateKey: process.env.VPS_PASSWORD!,
  });
}
