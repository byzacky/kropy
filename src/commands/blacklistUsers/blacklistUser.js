const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

const ADMIN_ID = '865129062595035137'; // The ID of the admin user
const blacklistFilePath = path.join(__dirname, '../../blacklist-log/blacklist.json'); // Update path to use absolute path

let BLACKLIST = new Set(); // Using a Set to store blacklisted user IDs

// Load the blacklist from the JSON file
const loadBlacklist = () => {
    try {
        if (fs.existsSync(blacklistFilePath)) {
            const data = fs.readFileSync(blacklistFilePath, 'utf8');
            const json = JSON.parse(data);
            BLACKLIST = new Set(json.blacklistedUsers);
        } else {
            // Create the file if it doesn't exist
            fs.writeFileSync(blacklistFilePath, JSON.stringify({ blacklistedUsers: [] }, null, 2));
        }
    } catch (error) {
        console.error('Error loading blacklist:', error);
    }
};

// Save the blacklist to the JSON file
const saveBlacklist = () => {
    try {
        const json = { blacklistedUsers: Array.from(BLACKLIST) };
        fs.writeFileSync(blacklistFilePath, JSON.stringify(json, null, 2));
    } catch (error) {
        console.error('Error saving blacklist:', error);
    }
};

// Remove a user from the blacklist
const removeFromBlacklist = (userId) => {
    BLACKLIST.delete(userId);
    saveBlacklist(); // Save updated blacklist
};

loadBlacklist(); // Load blacklist on startup

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist-user')
        .setDescription('Blacklist a user from using commands.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to blacklist')
                .setRequired(true)),
    async execute(interaction) {
        const userToBlacklist = interaction.options.getUser('user');

        if (interaction.user.id !== ADMIN_ID) {
            return await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        BLACKLIST.add(userToBlacklist.id);
        saveBlacklist(); // Save updated blacklist
        await interaction.reply(`${userToBlacklist.tag} has been blacklisted.`);
    },
    getBlacklist: () => BLACKLIST,
    removeFromBlacklist, // Export the removeFromBlacklist function
};
