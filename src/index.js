require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialisation du Command Handler
client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

// Enregistrement des Slash Commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`[System] Début du rafraîchissement des commandes (/)`);
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );
        console.log(`[System] Succès : Commandes (/) enregistrées.`);
    } catch (error) {
        console.error(error);
    }
})();

// Gestionnaire d'interactions amélioré
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`[Error] Erreur sur la commande ${interaction.commandName}:`, error.message);
        
        const errorMessage = { content: 'Une erreur technique est survenue.', ephemeral: true };
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    }
});

// Correction du DeprecationWarning (v15 ready)
client.once('clientReady', (readyClient) => {
    console.log(`[Ready] AstroCore est en ligne : ${readyClient.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);