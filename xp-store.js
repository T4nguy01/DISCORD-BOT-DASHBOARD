const fs = require("node:fs");
const path = require("node:path");

const FILE = path.join(__dirname, "data", "xp.json");

// Mee6-style XP required to reach level n
function xpForLevel(level) {
    return 5 * level * level + 50 * level + 100;
}

function levelFromXp(xp) {
    let level = 0;
    let total = 0;
    while (total + xpForLevel(level) <= xp) {
        total += xpForLevel(level);
        level++;
    }
    return level;
}

function xpIntoLevel(xp) {
    let level = 0;
    let total = 0;
    while (total + xpForLevel(level) <= xp) {
        total += xpForLevel(level);
        level++;
    }
    return xp - total;           // XP accumulated in current level
}

let xpCache = null;

function _load() {
    if (xpCache) return xpCache;
    try {
        const raw = fs.readFileSync(FILE, "utf8");
        xpCache = JSON.parse(raw);
        return xpCache;
    } catch {
        xpCache = {};
        return xpCache;
    }
}

function _save(data) {
    xpCache = data;
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// Returns { xp, level, lastActivity }
function getUser(guildId, userId) {
    const all = _load();
    const data = (all[guildId]?.[userId]) || { xp: 0, level: 0, lastActivity: 0 };
    // Migration: rename lastMessage to lastActivity if needed
    if (data.lastMessage && !data.lastActivity) {
        data.lastActivity = data.lastMessage;
        delete data.lastMessage;
    }
    return data;
}

function recordActivity(guildId, userId) {
    const all = _load();
    if (!all[guildId]) all[guildId] = {};
    const user = all[guildId][userId] || { xp: 0, level: 0, lastActivity: 0 };
    user.lastActivity = Date.now();
    all[guildId][userId] = user;
    _save(all);
}

// Add XP (with 60s cooldown). Returns { gained, oldLevel, newLevel, xp }
function addXp(guildId, userId, amount) {
    const all = _load();
    if (!all[guildId]) all[guildId] = {};

    const now = Date.now();
    const user = all[guildId][userId] || { xp: 0, level: 0, lastMessage: 0 };

    // 60-second anti-spam cooldown
    if (now - user.lastMessage < 60_000) return null;

    const oldLevel = user.level;
    user.xp += amount;
    user.level = levelFromXp(user.xp);
    user.lastActivity = now;

    all[guildId][userId] = user;
    _save(all);

    return { gained: amount, oldLevel, newLevel: user.level, xp: user.xp };
}

// Returns sorted leaderboard array [{ userId, xp, level }]
function getLeaderboard(guildId, limit = 10) {
    const all = _load();
    const guild = all[guildId] || {};
    return Object.entries(guild)
        .map(([userId, d]) => ({ userId, xp: d.xp, level: d.level }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit);
}

// Rank of a user in guild (1-indexed)
function getRank(guildId, userId) {
    const all = _load();
    const guild = all[guildId] || {};
    const sorted = Object.entries(guild)
        .sort(([, a], [, b]) => b.xp - a.xp)
        .map(([id]) => id);
    const idx = sorted.indexOf(userId);
    return idx === -1 ? null : idx + 1;
}

module.exports = { getUser, addXp, recordActivity, getLeaderboard, getRank, xpForLevel, xpIntoLevel, levelFromXp };
