import { prisma } from "../db/index.js";

export async function deleteExpiredVpnTraffic() {
  try {
    // 1. Find expired VPNs
    const expiredVPNs = await prisma.vPN.findMany({
      where: { expired: true },
      select: { id: true },
    });
    const expiredVpnIds = expiredVPNs.map((vpn) => vpn.id);

    // 2. Delete traffic for expired VPNs
    if (expiredVpnIds.length > 0) {
      const deletedTraffic = await prisma.traffic.deleteMany({
        where: { vpnId: { in: expiredVpnIds } },
      });
      console.log(
        `Deleted ${deletedTraffic.count} traffic records for expired VPNs.`
      );
    }

    // 3. Delete expired VPNs themselves
    const deletedVpns = await prisma.vPN.deleteMany({
      where: { expired: true },
    });
    console.log(`Deleted ${deletedVpns.count} expired VPNs.`);

    // 4. Delete orphaned traffic (traffic without matching VPN)
    const allVpnIds = await prisma.vPN
      .findMany({ select: { id: true } })
      .then((vpns) => vpns.map((vpn) => vpn.id));

    const deletedOrphanTraffic = await prisma.traffic.deleteMany({
      where: { vpnId: { notIn: allVpnIds } },
    });
    console.log(
      `Deleted ${deletedOrphanTraffic.count} orphaned traffic records.`
    );

    console.log("VPN and traffic cleanup completed successfully.");
  } catch (error) {
    console.error("Error during VPN and traffic cleanup:", error);
  }
}
