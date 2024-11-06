const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong! and shows the bot\'s latency.'),
    async execute(interaction) {
        // Reply with initial message and fetch the reply
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        
        // Calculate latency based on timestamps
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        
        // Fetch API latency with error handling
        let apiLatency;
        try {
            apiLatency = Math.round(interaction.client.ws.ping);
        } catch (error) {
            apiLatency = 'Unavailable';
            console.error('Error fetching API latency:', error);
        }

        // Create an embed with the latency information
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🏓 Pong!')
            .setDescription(`**Latency ⏳: ${latency}ms**\n**API Latency 🔑: ${apiLatency}ms**`)
            .setTimestamp()
            .setFooter({ text: 'Ping Command' });

        // Edit the initial reply to include the embed
        await interaction.editReply({ embeds: [embed] });
    },
};
