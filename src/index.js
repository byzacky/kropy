const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables

const TOKEN = process.env.TOKEN; // Get the token from the .env file
if (!TOKEN) {
    console.error('Bot token is not set. Please check your .env file.');
    process.exit(1); // Exit if no token is found
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Register commands
const commands = [];

// Function to recursively get command files
const getCommandFiles = (dir) => {
    const files = fs.readdirSync(dir);
    let commandFiles = [];

    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            // If it's a directory, recursively get command files
            commandFiles = commandFiles.concat(getCommandFiles(filePath));
        } else if (file.endsWith('.js')) {
            commandFiles.push(filePath);
        }
    }

    return commandFiles;
};

// Get command files from the commands directory
const commandFiles = getCommandFiles(path.join(__dirname, 'commands'));

for (const file of commandFiles) {
    try {
        // Correct path for require
        const command = require(file);

        // Ensure that command data is valid
        if (command.data && command.data.toJSON) {
            commands.push(command.data.toJSON());
        } else {
            console.error(`Command at ${file} is missing valid data. / [$missing-data]`);
        }
    } catch (error) {
        console.error(`Error loading command file ${file}:`, error);
    }
}

// Log in to Discord with your bot token
client.login(TOKEN).then(() => {
    const rest = new REST({ version: '9' }).setToken(TOKEN);
    
    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(Routes.applicationCommands(client.user.id), {
                body: commands,
            });

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error('Error reloading commands:', error);
        }
    })();
}).catch((error) => {
    console.error('Failed to log in:', error);
});

// Load event handlers
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(__dirname, 'events', file));
    client.on(event.name, (...args) => event.execute(...args, client));
}

// Check for blacklisted users before processing commands
client.on('messageCreate', (message) => {
    const BLACKLIST = require('./blacklist-log/blacklist.json').getBlacklist(); // Updated path
    if (BLACKLIST.has(message.author.id)) {
        return message.reply('You are blacklisted from using commands.');
    }
});
