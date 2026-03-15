// MOCK MODE: Replace this with real Razorpay checkout when ready
// 1. Add <script src="https://checkout.razorpay.com/v1/checkout.js">
//    to index.html
// 2. Add VITE_RAZORPAY_KEY_ID to .env
// 3. Replace confirm() mock with real window.Razorpay checkout

export function openRazorpayCheckout(
  params: {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    orderId: string;
  },
  onSuccess: (data: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) => void,
  onFailure: () => void
) {
  const amountInRupees = (params.amount / 100).toFixed(0);
  const ok = window.confirm(
    `Mock Payment: Click OK to simulate successful payment of ₹${amountInRupees} or Cancel to simulate failure`
  );

  if (ok) {
    const now = Date.now();
    onSuccess({
      razorpayOrderId: params.orderId,
      razorpayPaymentId: `mock_pay_${now}`,
      razorpaySignature: `mock_signature_${now}`,
    });
  } else {
    onFailure();
  }
}

