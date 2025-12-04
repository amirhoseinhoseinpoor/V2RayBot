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
  limit?: number;
}

export async function regenerateConfig({
  uuid,
  email,
  alterId,
  accountType,
  port,
  network,
  type,
  host,
  path,
  tls,
}: {
  uuid: string;
  email: string;
  alterId: number;
  accountType: "free" | "paid";
  port: number;
  network?: string;
  type?: string;
  host?: string;
  path?: string;
  tls?: string;
}): Promise<{ config: string }> {
  const vmess: VMessConfig = {
    v: "2",
    ps: `${accountType === "paid" ? "PremiumAccount" : "FreeAccount"}`,
    add: process.env.DOMAIN_HOSTIRAN!, // your domain or IP
    port: port.toString(),
    id: uuid,
    aid: alterId,
    net: network || "tcp",
    type: type || "free",
    host: process.env.DOMAIN_HOSTIRAN || "",
    path: path || "",
    tls: tls || "none",
    scy: "auto",
  };

  const configUrl = `vmess://${Buffer.from(JSON.stringify(vmess)).toString("base64")}`;

  return { config: configUrl };
}
