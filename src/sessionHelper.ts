interface SessionData {
    apple: number;
    waitingForReceipt?: {
        planId: string;
        startedAt: number;
    };
}

export function getSession(ctx: any) {
    if (!("sessionKey" in ctx)) {
        throw new Error("Session middleware not applied!");
    }
    return ctx.sessionKey as SessionData;
}