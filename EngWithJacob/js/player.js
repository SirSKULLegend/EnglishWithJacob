const DEFAULT_PLAYER = {
    id: "guest",
    tier: "Squire", // Squire | Knight | Royal
    coins: 2500,
    xp: 0,
    streak: 0,
    completed: {
        reading: [],
        listening: [],
        speaking: [],
        writing: [],
        story: []
    },
    titles: []
};

function loadPlayer() {
    const saved = localStorage.getItem("player");
    return saved ? JSON.parse(saved) : structuredClone(DEFAULT_PLAYER);
}

function savePlayer(player) {
    localStorage.setItem("player", JSON.stringify(player));
}

function reward({ coins = 0, xp = 0 }) {
    player.coins += coins;
    player.xp += xp;
    savePlayer(player);
}

function requireTier(required) {
    const tiers = ["Squire", "Knight", "Royal"];
    return tiers.indexOf(player.tier) >= tiers.indexOf(required);
}

function unlockChapter(id, cost = 700) {
    if (player.tier === "Royal") {
        player.completed.story.push(id);
        savePlayer(player);
        return true;
    }

    if (player.coins < cost) return false;

    player.coins -= cost;
    player.completed.story.push(id);
    savePlayer(player);
    return true;
}

let player = loadPlayer();

// Cloud Sync Logic (Called from firebase.js module)
async function syncPlayer(uid, loadCloudPlayerFn) {
    if (!loadCloudPlayerFn) return;
    console.log("Syncing player...", uid);
    const cloud = await loadCloudPlayerFn(uid);
    if (cloud) {
        player = { ...player, ...cloud }; // Merge/Overwrite
        savePlayer(player);
        console.log("Player synced from cloud!");
        // Refresh UI if needed
        if (typeof updateContent === 'function') updateContent();
    } else {
        // First time? Save local to cloud
        console.log("No cloud save found. Uploading local...");
        if (window.saveCloudPlayer) window.saveCloudPlayer(uid, player);
    }
}

// Hook for Firebase Module to trigger
window.initCloudSync = (auth, loadCloudPlayerFn, saveCloudPlayerFn) => {
    // Expose save function for internal use
    window.saveCloudPlayer = saveCloudPlayerFn;

    // Listen for auth state
    if (auth && auth.onAuthStateChanged) {
        auth.onAuthStateChanged(user => {
            if (user) {
                console.log("User signed in:", user.uid);
                syncPlayer(user.uid, loadCloudPlayerFn);
            }
        });
    }
};

window.activateAdminMode = function () {
    const password = prompt("Enter Admin Password:");
    if (password === "5555") {
        player.coins = 10000000; // 10 Million
        player.tier = "Royal";

        // Unlock all chapters (1-15)
        // Store progress index for map logic
        localStorage.setItem("silverKingdom_progress", 15);

        // Populate completion arrays for safety
        for (let i = 1; i <= 15; i++) {
            if (!player.completed.story.includes(i)) player.completed.story.push(i);
        }

        savePlayer(player);
        alert("ACCESS GRANTED: 10M Coins Added. Royal Tier Unlocked. All Chapters Open.");
        window.location.reload();
    } else {
        alert("ACCESS DENIED");
    }
};
