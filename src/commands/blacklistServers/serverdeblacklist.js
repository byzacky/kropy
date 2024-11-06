const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

const blacklistFilePath = './src/blacklist-log/server-blacklist.json'; // Update path
let BLACKLIST = new Set(); // Using a Set to store blacklisted server IDs

// Load the blacklist from the JSON file
const loadBlacklist = () => {
    if (fs.existsSync(blacklistFilePath)) {
        const data = fs.readFileSync(blacklistFilePath);
        const json = JSON.parse(data);
        BLACKLIST = new Set(json.blacklistedServers);
    } else {
        // Create the file if it doesn't exist
        fs.writeFileSync(blacklistFilePath, JSON.stringify({ blacklistedServers: [] }, null, 2));
    }
};

// Save the blacklist to the JSON file
const saveBlacklist = () => {
    const json = { blacklistedServers: Array.from(BLACKLIST) };
    fs.writeFileSync(blacklistFilePath, JSON.stringify(json, null, 2));
};

loadBlacklist(); // Load blacklist on startup

const ALLOWED_USER_ID = '865129062595035137'; // ID of the user allowed to use the command

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverdeblacklist')
        .setDescription('Remove a server from the blacklist.')
        .addStringOption(option =>
            option.setName('server_id')
                .setDescription('The ID of the server to remove from blacklist')
                .setRequired(true)),
    async execute(interaction) {
        const serverId = interaction.options.getString('server_id');

        // Check if the interaction is from the allowed user
        if (interaction.user.id !== ALLOWED_USER_ID) {
            return interaction.reply({ content: '❌| You are not authorized to use this command.', ephemeral: true });
        }

        // Check if the interaction is from a guild
        if (!interaction.guild) {
            return interaction.reply({ content: '❌| This command can only be used in a server.', ephemeral: true });
        }

        // Check if the user executing the command has admin permissions
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({ content: '❌| You do not have **ADMINISTRATOR** permission to use this command.', ephemeral: true });
        }

        if (!BLACKLIST.has(serverId)) {
            return interaction.reply({ content: '❌| This server is not blacklisted.', ephemeral: true });
        }

        BLACKLIST.delete(serverId);
        saveBlacklist(); // Save updated blacklist
        await interaction.reply(`✅ | Server with ID ${serverId} has been removed from the blacklist.`);
    },
    getBlacklist: () => BLACKLIST
};
1