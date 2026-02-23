const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const configStore = require("../core/config-store");

/**
 * Creates a support ticket channel for a user.
 */
async function createTicket(guild, user) {
    const config = configStore.getGuildConfig(guild.id);
    if (!config.ticketCategoryId) throw new Error("La catégorie de ticket n'est pas configurée.");

    const ticketName = `ticket-${user.username}`.toLowerCase();

    // Check if user already has an open ticket (optional, but good practice)
    const existing = guild.channels.cache.find(c => c.name === ticketName && c.parentId === config.ticketCategoryId);
    if (existing) return existing;

    const permissions = [
        {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
        },
        {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
        },
        {
            id: guild.members.me.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
        }
    ];

    if (config.ticketSupportRoleId) {
        permissions.push({
            id: config.ticketSupportRoleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        });
    }

    const channel = await guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: config.ticketCategoryId,
        permissionOverwrites: permissions,
        topic: `Ticket de support pour ${user.tag} (${user.id})`
    });

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("Support - Nouveau Ticket")
        .setDescription(`Bonjour ${user}, un membre de l'équipe de support sera avec vous sous peu.
Veuillez décrire votre problème en détail en attendant.`)
        .setFooter({ text: "Utilisez le bouton ci-dessous pour fermer le ticket." })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket_close")
            .setLabel("Fermer le ticket")
            .setStyle(ButtonStyle.Danger)
            .setEmoji("🔒")
    );

    await channel.send({ content: `${user} ${config.ticketSupportRoleId ? `<@&${config.ticketSupportRoleId}>` : ""}`, embeds: [embed], components: [row] });

    return channel;
}

/**
 * Closes and handles the transcript of a ticket.
 */
async function closeTicket(channel, closedBy) {
    const config = configStore.getGuildConfig(channel.guildId);

    await channel.send(`🔒 Ticket fermé par **${closedBy.tag}**. Suppression dans 10 secondes...`);

    // In a real production bot, you'd generate a transcript here and send it to the transcript channel.
    // For this implementation, we'll just log it.
    if (config.ticketTranscriptChannelId) {
        const logChannel = channel.guild.channels.cache.get(config.ticketTranscriptChannelId);
        if (logChannel?.isTextBased()) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle("Ticket Fermé")
                .addFields(
                    { name: "Salon", value: `#${channel.name}`, inline: true },
                    { name: "Fermé par", value: `${closedBy.tag}`, inline: true }
                )
                .setTimestamp();
            await logChannel.send({ embeds: [embed] }).catch(() => { });
        }
    }

    setTimeout(() => {
        channel.delete().catch(() => { });
    }, 10000);
}

module.exports = { createTicket, closeTicket };
