const { v4: uuidv4 } = require("uuid");

/**
 * Placeholder payment flow. Wire Razorpay/Stripe/PayPal SDKs using env keys in production.
 * When gateway keys are missing, completes as "mock" success for demos.
 */
async function processPayment({ method, amount, currency }) {
  const hasRazorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
  const hasStripe = process.env.STRIPE_SECRET_KEY;
  const hasPayPal = process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET;

  if (method === "razorpay" && hasRazorpay) {
    return {
      ok: true,
      transactionId: `rzp_${uuidv4()}`,
      note: "Razorpay: verify payment signature on webhook in production",
    };
  }
  if (method === "stripe" && hasStripe) {
    return {
      ok: true,
      transactionId: `stripe_${uuidv4()}`,
      note: "Stripe: create PaymentIntent server-side in production",
    };
  }
  if (method === "paypal" && hasPayPal) {
    return {
      ok: true,
      transactionId: `pp_${uuidv4()}`,
      note: "PayPal: use Orders API in production",
    };
  }

  return {
    ok: true,
    transactionId: `mock_${uuidv4()}`,
    note: "Mock payment — configure gateway env vars for live charges",
  };
}

function platformFeePercent() {
  const n = parseFloat(process.env.PLATFORM_FEE_PERCENT || "2", 10);
  return Number.isFinite(n) && n >= 0 ? n : 2;
}

module.exports = { processPayment, platformFeePercent };
