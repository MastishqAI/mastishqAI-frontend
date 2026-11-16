import api from "./api";

let scriptPromise = null;
const loadCheckout = () => {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js"; s.async = true;
    s.onload = resolve; s.onerror = () => { scriptPromise = null; reject(new Error("Couldn't load the payment window. Check your connection.")); };
    document.body.appendChild(s);
  });
  return scriptPromise;
};

// Opens Razorpay Checkout for the Pro plan. Resolves { plan, planExpiresAt } once the server has verified the payment,
// or null if the learner closed the window. Throws an Error with a readable message otherwise.
export async function buyPro(user) {
  await loadCheckout();
  const o = await api.post("/payments/order");
  return new Promise((resolve, reject) => {
    const rz = new window.Razorpay({
      key: o.keyId, order_id: o.orderId, amount: o.amount, currency: o.currency,
      name: "Mastishq.ai", description: "Pro plan, 30 days",
      prefill: { name: user?.name, email: user?.email, contact: user?.phone },
      theme: { color: "#4A9BE8" },
      handler: async (resp) => {
        try { resolve(await api.post("/payments/verify", resp)); }
        catch (e) { reject(new Error(e.message || "We received your payment but couldn't confirm it yet. It will show up shortly; contact support if it doesn't.")); }
      },
      modal: { ondismiss: () => resolve(null) },
    });
    rz.on("payment.failed", (r) => reject(new Error(r?.error?.description || "Payment failed. You have not been charged.")));
    rz.open();
  });
}
