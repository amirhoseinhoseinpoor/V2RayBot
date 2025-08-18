interface SessionData {
    apple: number;
    waitingForReceipt?: {
        planId: string;
        holdOver: boolean;
        vpnId : number;
        startedAt: number;
    };
}

export function getSession(ctx: any) {
    if (!("sessionKey" in ctx)) {
        throw new Error("Session middleware not applied!");
    }
    return ctx.sessionKey as SessionData;
}