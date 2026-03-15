// MOCK MODE: Replace this with real Razorpay instance when ready
// 1. npm install razorpay
// 2. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env
// 3. Replace mock orders.create with:
//    import Razorpay from "razorpay"
//    const razorpay = new Razorpay({ key_id, key_secret })
//    export const razorpay = razorpay

// Minimal mock Razorpay-like object used for local development/testing.
// It exposes an orders.create method that returns a fake order object.

export const razorpay = {
  orders: {
    async create(params: { amount: number; currency: string; receipt?: string }) {
      return {
        id: `mock_order_${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        receipt: params.receipt ?? "",
      };
    },
  },
};

