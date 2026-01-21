const EVENTS = {
    speakingArena: {
        cost: 300,
        rewardXP: 150,
        title: "🗣 Arena Champion"
    }
};

function enterEvent(eventId) {
    const e = EVENTS[eventId];
    if (!e) return;

    if (player.coins < e.cost) return alert("Not enough coins");
    player.coins -= e.cost;
    player.xp += e.rewardXP;
    if (!player.titles.includes(e.title)) {
        player.titles.push(e.title);
    }
    savePlayer(player);
}
