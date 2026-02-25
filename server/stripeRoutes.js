const express = require("express");
const router = express.Router();
const stripe = require("./stripe");

const PACKAGE_PRICES = {
  daily: 500,
  weekly: 2500,
  monthly: 8000,
};

// Log Stripe configuration status
console.log("Stripe configuration:", {
  hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
  keyLength: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0
});

router.post("/create-checkout-session", async (req, res) => {
  const { packageType, userId } = req.body;

  console.log("Checkout request received:", { packageType, userId });

  if (!packageType) {
    return res.status(400).json({ error: "Package type is required" });
  }

  if (!PACKAGE_PRICES[packageType]) {
    return res.status(400).json({ error: `Invalid package type: ${packageType}. Valid types are: daily, weekly, monthly` });
  }

  try {
    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return res.status(500).json({ error: "Server configuration error: Stripe keys missing" });
    }

    const productName = `${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Subscription`;
    
    // Use fallback origin if req.headers.origin is undefined
    const origin = req.headers.origin || 'http://localhost:3000';
    console.log("Using origin:", origin);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: productName },
            unit_amount: PACKAGE_PRICES[packageType],
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription/cancel`,
      metadata: { userId: userId || 'unknown', packageType },
    });

    console.log("Stripe session created successfully:", session.id);
    return res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error details:", {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param
    });
    
    return res.status(500).json({
      error: "Payment processing failed",
      details: error.message,
      code: error.code
    });
  }
});

router.get("/test", (req, res) => {
  res.json({ success: true, message: "Stripe route is working!" });
});

module.exports = router;