function useAI(cost = 50) {
    if (player.tier === "Royal") return true;

    if (player.coins < cost) {
        alert("Not enough King Coins 👑");
        return false;
    }
    player.coins -= cost;
    savePlayer(player);
    return true;
}
