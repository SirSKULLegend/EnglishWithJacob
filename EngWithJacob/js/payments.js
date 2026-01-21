async function checkout(plan) {
    const res = await fetch("/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({ plan }),
        headers: { "Content-Type": "application/json" }
    });
    const { url } = await res.json();
    window.location.href = url;
}
