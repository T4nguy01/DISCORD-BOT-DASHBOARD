const { Events } = require("discord.js");
const configStore = require("../config-store");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isStringSelectMenu()) return;
        if (interaction.customId !== "role_select") return;

        const config = configStore.getGuildConfig(interaction.guildId);
        const selectedRoleIds = interaction.values; // IDs selected by the user
        const availableRoleIds = config.selfRoles || [];

        await interaction.deferReply({ ephemeral: true });

        try {
            const member = interaction.member;
            const currentRoles = member.roles.cache;

            // Simple logic:
            // 1. Roles in interaction.values but NOT in member.roles -> Add
            // 2. Roles NOT in interaction.values but IN member.roles AND IN availableRoleIds -> Remove

            const rolesToAdd = selectedRoleIds.filter(id => !currentRoles.has(id));
            const rolesToRemove = availableRoleIds.filter(id => !selectedRoleIds.includes(id) && currentRoles.has(id));

            if (rolesToAdd.length > 0) await member.roles.add(rolesToAdd);
            if (rolesToRemove.length > 0) await member.roles.remove(rolesToRemove);

            let msg = "✅ Vos rôles ont été mis à jour !";
            if (rolesToAdd.length > 0) msg += `\n➕ Ajoutés : ${rolesToAdd.map(id => `<@&${id}>`).join(", ")}`;
            if (rolesToRemove.length > 0) msg += `\n➖ Retirés : ${rolesToRemove.map(id => `<@&${id}>`).join(", ")}`;

            await interaction.editReply({ content: msg });
        } catch (error) {
            console.error("[SelfRole] Error sync roles:", error.message);
            await interaction.editReply({ content: "❌ Une erreur est survenue lors de la mise à jour de vos rôles. Vérifiez mes permissions." });
        }
    },
};
