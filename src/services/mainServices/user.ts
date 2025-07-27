import {prisma} from "../../db/index.js";
import { User as TelegramUser } from "gramio";

export async function findOrCreateUser(telegramUser: TelegramUser) {
  return await prisma.user.upsert({
    where: { telegramId: telegramUser.id },
    update: {},
    create: {
      telegramId: telegramUser.id,
      username: telegramUser.username ?? null,
      firstName: telegramUser.firstName,
    },
  });
}

export async function markFreeAccountUsed(telegramId: bigint) {
  return await prisma.user.update({
    where: { telegramId },
    data: { freeAccount: true },
  });
}

export async function hasUsedFreeAccount(telegramId: bigint) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
    select: { freeAccount: true },
  });
  return user?.freeAccount ?? false;
}
