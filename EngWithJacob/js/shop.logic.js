window.ShopLogic = (() => {
  const cfg = window.SHOP_CONFIG;
  const ui = window.ShopUI;

  function ensurePlayer() {
    if (typeof window.player === "undefined") {
      throw new Error("player is not defined. Make sure ../js/player.js loads before shop scripts.");
    }
    if (typeof window.savePlayer !== "function") {
      throw new Error("savePlayer(player) is not defined. Ensure your player system exposes savePlayer.");
    }
  }

  function getSelectedQty(cardEl) {
    const active = cardEl.querySelector(".tier-btn.active");
    return active ? Number(active.dataset.qty || "1") : 1;
  }

  function getCoinPrice(cardEl) {
    const sku = cardEl.dataset.sku;

    if (sku === "title_unlock") {
      const select = cardEl.querySelector("[data-titleSelect]");
      return Number(select?.value || "500");
    }

    const qty = getSelectedQty(cardEl);
    const product = cfg.coinProducts[sku];
    if (!product) return 0;
    return Number(product.basePrices[qty] ?? 0);
  }

  function updateCardPricingAndStates(cardEl) {
    ensurePlayer();

    const isCoinProduct = cardEl.dataset.product === "coinPack" || cardEl.dataset.product === "coinSingle";
    if (!isCoinProduct) return;

    const price = getCoinPrice(cardEl);
    ui.setCardPrice(cardEl, price);

    const btn = cardEl.querySelector('[data-action="buyWithCoins"]');
    if (!btn) return;

    const canAfford = window.player.coins >= price;
    if (!canAfford) {
      const need = price - window.player.coins;
      ui.setButtonState(btn, false, ui.t("not_enough_coins", { need }));
    } else {
      ui.setButtonState(btn, true, "");
    }
  }

  function refreshAll() {
    ensurePlayer();
    ui.setBalance(window.player.coins);

    ui.$all(".product-card").forEach(card => {
      updateCardPricingAndStates(card);

      // update title unlock price when language changes (text changes only)
      if (card.dataset.sku === "title_unlock") {
        const price = getCoinPrice(card);
        ui.setCardPrice(card, price);
      }
    });
  }

  // --- Actions ---
  function buyWithCoins(cardEl) {
    ensurePlayer();
    const sku = cardEl.dataset.sku;
    const price = getCoinPrice(cardEl);

    if (window.player.coins < price) {
      const need = price - window.player.coins;
      ui.toast("error", ui.t("toast_error"), ui.t("not_enough_coins", { need }));
      refreshAll();
      return;
    }

    // Deduct coins
    window.player.coins -= price;

    // TODO: Add actual inventory / scheduling logic here:
    // - private_lesson: add lesson credits
    // - group_session: add group credits
    // - streak_shield: increment shield count
    // - title_unlock: unlock selected title label

    window.savePlayer(window.player);

    const successMsg =
      (sku === "private_lesson" || sku === "group_session") ? ui.t("booked") : ui.t("purchased");

    ui.toast("success", ui.t("toast_success"), successMsg);
    refreshAll();
  }

  function subscribeLocal(tier) {
    ensurePlayer();

    const plan = cfg.memberships[tier];
    if (!plan) return;

    if (!confirm(`${tier} — +${plan.coinsReward} coins`)) return;

    window.player.tier = tier;
    window.player.coins += plan.coinsReward;

    window.savePlayer(window.player);

    ui.toast("success", ui.t("toast_success"), ui.t("subscribed", { tier, coins: plan.coinsReward }));
    refreshAll();
  }

  // --- Stripe / Apple Pay Prep ---
  async function payStripe(tier) {
    const stripeKey = cfg.stripe.publishableKey;
    if (!stripeKey || stripeKey.includes("REPLACE_ME")) {
      ui.toast("error", ui.t("toast_error"), ui.t("stripe_not_ready"));
      return;
    }

    ui.toast("info", ui.t("toast_info"), ui.t("stripe_redirect"));

    const stripe = Stripe(stripeKey);

    // Backend creates a Checkout Session and returns { sessionId }
    const res = await fetch(cfg.stripe.createCheckoutSessionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier })
    });

    if (!res.ok) {
      ui.toast("error", ui.t("toast_error"), `Checkout error (${res.status}).`);
      return;
    }

    const data = await res.json();
    if (!data.sessionId) {
      ui.toast("error", ui.t("toast_error"), "Missing sessionId from server.");
      return;
    }

    const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
    if (error) {
      ui.toast("error", ui.t("toast_error"), error.message || "Stripe redirect failed.");
    }
  }

  function wireTierButtons() {
    ui.$all(".tiers-options").forEach(group => {
      group.addEventListener("click", (e) => {
        const btn = e.target.closest(".tier-btn");
        if (!btn) return;

        // activate clicked
        group.querySelectorAll(".tier-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const card = group.closest(".product-card");
        if (card) updateCardPricingAndStates(card);
      });
    });
  }

  function wireTitleSelect() {
    ui.$all("[data-titleSelect]").forEach(sel => {
      sel.addEventListener("change", () => {
        const card = sel.closest(".product-card");
        if (card) updateCardPricingAndStates(card);
      });
    });
  }

  function wireActions() {
    // Subscribe (local / simulated)
    ui.$all('[data-action="subscribe"]').forEach(btn => {
      btn.addEventListener("click", () => subscribeLocal(btn.dataset.tier));
    });

    // Pay with Stripe (real)
    ui.$all('[data-action="payStripe"]').forEach(btn => {
      btn.addEventListener("click", () => payStripe(btn.dataset.tier));
    });

    // Buy with coins
    ui.$all('[data-action="buyWithCoins"]').forEach(btn => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".product-card");
        if (card) buyWithCoins(card);
      });
    });
  }

  function init() {
    ensurePlayer();

    // language init
    ui.applyLanguage(ui.getLang());
    ui.wireLanguageToggle();

    // wires
    wireTierButtons();
    wireTitleSelect();
    wireActions();

    // initial state
    refreshAll();
  }

  return { init, refreshAll };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (window.ShopLogic) window.ShopLogic.init();
});
