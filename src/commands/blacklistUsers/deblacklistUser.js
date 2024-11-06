const { SlashCommandBuilder } = require('discord.js');
const { getBlacklist, removeFromBlacklist } = require('./blacklistUser'); // Adjust path if necessary

const ADMIN_ID = '865129062595035137'; // The ID of the admin user

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deblacklist-user')
        .setDescription('Remove a user from the blacklist.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove from blacklist')
                .setRequired(true)),
    async execute(interaction) {
        const userToDeblacklist = interaction.options.getUser('user');
        const BLACKLIST = getBlacklist(); // Use the getBlacklist function

        if (interaction.user.id !== ADMIN_ID) {
            return await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        if (BLACKLIST.has(userToDeblacklist.id)) {
            removeFromBlacklist(userToDeblacklist.id); // Call the removeFromBlacklist function
            await interaction.reply(`${userToDeblacklist.tag} has been removed from the blacklist.`);
        } else {
            await interaction.reply(`${userToDeblacklist.tag} is not blacklisted.`);
        }
    },
};
