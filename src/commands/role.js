const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("role")
        .setDescription("Gérer les rôles du serveur")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand((sub) =>
            sub
                .setName("create")
                .setDescription("Créer un nouveau rôle")
                .addStringOption((opt) => opt.setName("nom").setDescription("Nom du rôle").setRequired(true))
                .addStringOption((opt) => opt.setName("couleur").setDescription("Couleur en hexadécimal (ex: #FF0000)").setRequired(false))
        )
        .addSubcommand((sub) =>
            sub
                .setName("delete")
                .setDescription("Supprimer un rôle")
                .addRoleOption((opt) => opt.setName("role").setDescription("Rôle à supprimer").setRequired(true))
        )
        .addSubcommand((sub) =>
            sub
                .setName("give")
                .setDescription("Attribuer un rôle à un membre")
                .addRoleOption((opt) => opt.setName("role").setDescription("Rôle à donner").setRequired(true))
                .addUserOption((opt) => opt.setName("membre").setDescription("Membre cible").setRequired(true))
        )
        .addSubcommand((sub) =>
            sub
                .setName("remove")
                .setDescription("Retirer un rôle d'un membre")
                .addRoleOption((opt) => opt.setName("role").setDescription("Rôle à retirer").setRequired(true))
                .addUserOption((opt) => opt.setName("membre").setDescription("Membre cible").setRequired(true))
        )
        .addSubcommand((sub) =>
            sub
                .setName("list")
                .setDescription("Lister les rôles du serveur")
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === "create") {
                const name = interaction.options.getString("nom");
                const color = interaction.options.getString("couleur") || "#99AAB5";

                const role = await interaction.guild.roles.create({
                    name: name,
                    color: color,
                    reason: `Créé par ${interaction.user.tag}`
                });

                return interaction.reply({ content: `✅ Rôle **${role.name}** créé avec succès !`, ephemeral: true });
            }

            if (subcommand === "delete") {
                const role = interaction.options.getRole("role");

                if (role.managed) return interaction.reply({ content: "❌ Impossible de supprimer un rôle géré par une intégration.", ephemeral: true });

                await role.delete(`Supprimé par ${interaction.user.tag}`);
                return interaction.reply({ content: `✅ Rôle supprimé avec succès !`, ephemeral: true });
            }

            if (subcommand === "give") {
                const role = interaction.options.getRole("role");
                const member = interaction.options.getMember("membre");

                if (member.roles.cache.has(role.id)) {
                    return interaction.reply({ content: `⚠️ ${member.user.username} possède déjà ce rôle.`, ephemeral: true });
                }

                await member.roles.add(role);
                return interaction.reply({ content: `✅ Rôle **${role.name}** attribué à ${member.user.username}.`, ephemeral: true });
            }

            if (subcommand === "remove") {
                const role = interaction.options.getRole("role");
                const member = interaction.options.getMember("membre");

                if (!member.roles.cache.has(role.id)) {
                    return interaction.reply({ content: `⚠️ ${member.user.username} ne possède pas ce rôle.`, ephemeral: true });
                }

                await member.roles.remove(role);
                return interaction.reply({ content: `✅ Rôle **${role.name}** retiré de ${member.user.username}.`, ephemeral: true });
            }

            if (subcommand === "list") {
                const roles = interaction.guild.roles.cache
                    .filter(r => r.id !== interaction.guildId)
                    .sort((a, b) => b.position - a.position)
                    .map(r => `${r.name} (${r.id})`)
                    .join("\n");

                const embed = new EmbedBuilder()
                    .setTitle(`Rôles de ${interaction.guild.name}`)
                    .setDescription(roles.length > 2048 ? roles.substring(0, 2045) + "..." : roles)
                    .setColor(0x5865F2);

                return interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error("[RoleCommand] Error:", error);
            return interaction.reply({ content: `❌ Une erreur est survenue : ${error.message}`, ephemeral: true });
        }
    },
};
