const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load the blacklist for users and servers
const { getBlacklist: getUserBlacklist } = require('../commands/blacklistUsers/blacklistUser');
const { getBlacklist: getServerBlacklist } = require('../commands/blacklistServers/serverblacklist');

// Load anti-nuke config
const configFilePath = './src/config/anti-nuke.json';
let antiNukeConfig = {
    enabled: false,
    authorizedAdmins: new Set(),
    authorizedRoles: new Set()
};

const loadAntiNukeConfig = () => {
    if (fs.existsSync(configFilePath)) {
        const rawData = fs.readFileSync(configFilePath);
        const parsedConfig = JSON.parse(rawData);

        antiNukeConfig.enabled = parsedConfig.enabled || false;
        antiNukeConfig.authorizedAdmins = new Set(parsedConfig.authorizedAdmins || []);
        antiNukeConfig.authorizedRoles = new Set(parsedConfig.authorizedRoles || []);
    }
};

const saveAntiNukeConfig = () => {
    const configToSave = {
        enabled: antiNukeConfig.enabled,
        authorizedAdmins: Array.from(antiNukeConfig.authorizedAdmins),
        authorizedRoles: Array.from(antiNukeConfig.authorizedRoles),
    };
    fs.writeFileSync(configFilePath, JSON.stringify(configToSave, null, 2));
};

// Create a collection to hold commands
const commands = new Collection();

// Function to get command files
const getCommandFiles = (dir) => {
    const files = fs.readdirSync(dir);
    let commandFiles = [];

    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            commandFiles = commandFiles.concat(getCommandFiles(filePath));
        } else if (file.endsWith('.js')) {
            commandFiles.push(filePath);
        }
    }

    return commandFiles;
};

// Load command files from the commands directory
const commandFiles = getCommandFiles(path.join(__dirname, '../commands'));

for (const file of commandFiles) {
    const command = require(file);
    commands.set(command.data.name, command);
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        console.log(`Interaction received: ${interaction.commandName}`);

        if (!interaction.isCommand()) return;

        // Get blacklists
        const userBlacklist = getUserBlacklist();
        const serverBlacklist = getServerBlacklist();

        // Check if the user is blacklisted
        if (userBlacklist.has(interaction.user.id)) {
            return interaction.reply({ content: 'You are blacklisted from using commands.', ephemeral: true });
        }

        // Check if the server is blacklisted
        if (interaction.guild && serverBlacklist.has(interaction.guild.id)) {
            return interaction.reply({ content: 'This server is blacklisted from using commands.', ephemeral: true });
        }

        // Load anti-nuke config
        loadAntiNukeConfig();

        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Error executing command:', error);
            try {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            } catch (replyError) {
                console.error('Error replying to interaction:', replyError);
            }
        }
    },
};
