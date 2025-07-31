import { CallbackData } from "gramio";

export const buyVPN = new CallbackData("buy-vpn");
export const selectPlan = new CallbackData("select-plan").number("planId");
export const backToPlans = new CallbackData("back-to-plans");
export const confirmPayment = new CallbackData("confirm-payment").number("paymentId");
export const rejectPayment = new CallbackData("reject-payment").number("paymentId");