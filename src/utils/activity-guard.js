const configStore = require("../core/config-store");
const xpStore = require("../core/xp-store");

/**
 * Syncs the 'Active' and 'Inactive' roles for a member based on their last activity.
 */
async function syncMemberRoles(member) {
    if (member.user.bot) return;

    const guildId = member.guild.id;
    const config = configStore.getGuildConfig(guildId);

    // Skip if role IDs are not configured
    if (!config.activeRoleId && !config.inactiveRoleId) return;

    const user = xpStore.getUser(guildId, member.id);
    const lastActivity = user.lastActivity || 0;
    const now = Date.now();
    const thresholdMs = (config.inactivityDays || 7) * 24 * 60 * 60 * 1000;

    const isActive = (now - lastActivity) < thresholdMs;

    try {
        const roles = member.roles.cache;
        const hasActive = config.activeRoleId && roles.has(config.activeRoleId);
        const hasInactive = config.inactiveRoleId && roles.has(config.inactiveRoleId);

        if (isActive) {
            // Should be active
            if (config.activeRoleId && !hasActive) await member.roles.add(config.activeRoleId);
            if (config.inactiveRoleId && hasInactive) await member.roles.remove(config.inactiveRoleId);
        } else {
            // Should be inactive
            if (config.inactiveRoleId && !hasInactive) await member.roles.add(config.inactiveRoleId);
            if (config.activeRoleId && hasActive) await member.roles.remove(config.activeRoleId);
        }
    } catch (error) {
        console.error(`[ERROR] Failed to sync roles for ${member.user.tag} in ${member.guild.name}:`, error.message);
    }
}

/**
 * Scans all members of a guild and syncs their roles.
 */
async function syncAllGuildMembers(guild) {
    try {
        const members = await guild.members.fetch();
        console.log(`[ActivityGuard] Scanning ${members.size} members in ${guild.name}...`);
        for (const member of members.values()) {
            await syncMemberRoles(member);
        }
    } catch (error) {
        console.error(`[ERROR] Failed to fetch members for ${guild.name}:`, error.message);
    }
}

module.exports = { syncMemberRoles, syncAllGuildMembers };
