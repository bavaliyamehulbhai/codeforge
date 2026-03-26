const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const { requireAuth } = require("../middleware/auth");
const User = require("../models/User");
const { PLAN_LIMITS } = require("../utils/plans");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

const PRICE_MAP = {
  pro: process.env.STRIPE_PRICE_PRO,
  team: process.env.STRIPE_PRICE_TEAM,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
};

const PRICE_ENV_MAP = {
  pro: "STRIPE_PRICE_PRO",
  team: "STRIPE_PRICE_TEAM",
  enterprise: "STRIPE_PRICE_ENTERPRISE",
};

const PLAN_META = {
  free: { price_label: "Free" },
  pro: { price_label: "$15/mo" },
  team: { price_label: "$39/mo" },
  enterprise: { price_label: "Custom" },
};

function getPlanFromPrice(priceId) {
  const entry = Object.entries(PRICE_MAP).find(([, id]) => id === priceId);
  return entry ? entry[0] : null;
}

function getBillingStatus() {
  const missingKeys = [];
  if (!STRIPE_SECRET_KEY) missingKeys.push("STRIPE_SECRET_KEY");
  if (!STRIPE_WEBHOOK_SECRET) missingKeys.push("STRIPE_WEBHOOK_SECRET");

  const missingPriceIds = Object.keys(PRICE_ENV_MAP).filter(
    (plan) => !PRICE_MAP[plan],
  );
  missingPriceIds.forEach((plan) => missingKeys.push(PRICE_ENV_MAP[plan]));

  return {
    configured: missingKeys.length === 0,
    missing_keys: missingKeys,
    missing_price_ids: missingPriceIds,
  };
}

router.get("/plans", (req, res) => {
  const plans = Object.keys(PLAN_LIMITS).map((plan) => ({
    id: plan,
    limits: PLAN_LIMITS[plan],
    price_label: PLAN_META[plan]?.price_label || "Custom",
  }));
  res.json({ plans });
});

router.get("/status", (req, res) => {
  res.json(getBillingStatus());
});

router.get("/upcoming", requireAuth, async (req, res) => {
  try {
    if (!stripe)
      return res.status(501).json({ error: "Billing not configured" });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.subscription?.customer_id)
      return res.status(400).json({ error: "Customer not found" });

    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: user.subscription.customer_id,
    });

    res.json({
      amount_due: invoice.amount_due || 0,
      currency: invoice.currency || "usd",
      next_payment_attempt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null,
      period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
    });
  } catch (err) {
    console.error("Upcoming invoice error:", err);
    res.status(500).json({ error: "Failed to fetch upcoming invoice" });
  }
});

router.post("/checkout", requireAuth, async (req, res) => {
  try {
    if (!stripe)
      return res.status(501).json({ error: "Billing not configured" });
    const { plan } = req.body;
    if (!plan || !PRICE_MAP[plan])
      return res.status(400).json({ error: "Invalid plan" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let customerId = user.subscription?.customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user._id.toString() },
      });
      customerId = customer.id;
      user.subscription.customer_id = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: PRICE_MAP[plan], quantity: 1 }],
      success_url: `${FRONTEND_URL}/settings?billing=success`,
      cancel_url: `${FRONTEND_URL}/settings?billing=cancel`,
      metadata: { user_id: user._id.toString(), plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.get("/portal", requireAuth, async (req, res) => {
  try {
    if (!stripe)
      return res.status(501).json({ error: "Billing not configured" });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.subscription?.customer_id)
      return res.status(400).json({ error: "Customer not found" });

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.customer_id,
      return_url: `${FRONTEND_URL}/settings`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

router.post("/cancel", requireAuth, async (req, res) => {
  try {
    if (!stripe)
      return res.status(501).json({ error: "Billing not configured" });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.subscription?.subscription_id)
      return res.status(400).json({ error: "Subscription not found" });

    const updated = await stripe.subscriptions.update(
      user.subscription.subscription_id,
      {
        cancel_at_period_end: true,
      },
    );

    user.subscription.status = updated.status;
    user.subscription.current_period_end = updated.current_period_end
      ? new Date(updated.current_period_end * 1000)
      : user.subscription.current_period_end;
    user.subscription.cancel_at_period_end = Boolean(
      updated.cancel_at_period_end,
    );
    await user.save();

    res.json({
      status: user.subscription.status,
      current_period_end: user.subscription.current_period_end,
      cancel_at_period_end: user.subscription.cancel_at_period_end,
    });
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

router.post("/resume", requireAuth, async (req, res) => {
  try {
    if (!stripe)
      return res.status(501).json({ error: "Billing not configured" });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.subscription?.subscription_id)
      return res.status(400).json({ error: "Subscription not found" });

    const updated = await stripe.subscriptions.update(
      user.subscription.subscription_id,
      {
        cancel_at_period_end: false,
      },
    );

    user.subscription.status = updated.status;
    user.subscription.current_period_end = updated.current_period_end
      ? new Date(updated.current_period_end * 1000)
      : user.subscription.current_period_end;
    user.subscription.cancel_at_period_end = Boolean(
      updated.cancel_at_period_end,
    );
    await user.save();

    res.json({
      status: user.subscription.status,
      current_period_end: user.subscription.current_period_end,
      cancel_at_period_end: user.subscription.cancel_at_period_end,
    });
  } catch (err) {
    console.error("Resume error:", err);
    res.status(500).json({ error: "Failed to resume subscription" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    if (!stripe || !STRIPE_WEBHOOK_SECRET)
      return res.status(501).json({ error: "Billing not configured" });
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      if (userId) {
        const plan = session.metadata?.plan || "pro";
        await User.findByIdAndUpdate(userId, {
          plan,
          "subscription.status": "active",
          "subscription.subscription_id": session.subscription || "",
        });
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const plan = getPlanFromPrice(priceId) || "free";
      const status = subscription.status;
      const customerId = subscription.customer;

      await User.findOneAndUpdate(
        { "subscription.customer_id": customerId },
        {
          plan: status === "active" ? plan : "free",
          "subscription.status": status,
          "subscription.subscription_id": subscription.id,
          "subscription.cancel_at_period_end": Boolean(
            subscription.cancel_at_period_end,
          ),
          "subscription.current_period_end": subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null,
        },
      );
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

module.exports = router;
