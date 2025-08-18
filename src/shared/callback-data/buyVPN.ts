import { CallbackData } from "gramio";

export const buyVPN = new CallbackData("buy-vpn");
export const selectPlan = new CallbackData("select-plan").number("planId").number("vpnId").boolean('holdOver');
export const backToPlans = new CallbackData("back-to-plans").number("vpnId").boolean('holdOver');
export const confirmPayment = new CallbackData("confirm-payment").number("paymentId").number("vpnId").boolean('holdOver');;
export const rejectPayment = new CallbackData("reject-payment").number("paymentId");