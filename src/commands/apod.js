const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');
const axios = require('axios');
const { translate } = require('google-translate-api-x');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image-du-jour')
        .setDescription('Affiche l\'image d\'astronomie du jour (NASA) avec option de traduction'),
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
            const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
            
            const response = await axios.get(url);
            const data = response.data;

            // Création de l'Embed original (Anglais)
            const createEmbed = (title, description) => {
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`✨ ${title}`)
                    .setDescription(description.length > 2000 ? description.substring(0, 2000) + '...' : description)
                    .setImage(data.hdurl || data.url)
                    .setTimestamp()
                    .setFooter({ text: 'Source: NASA APOD API' });

                if (data.copyright) {
                    embed.setAuthor({ name: `© ${data.copyright}` });
                }
                return embed;
            };

            const initialEmbed = createEmbed(data.title, data.explanation);

            // Création du bouton de traduction
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('translate_fr')
                        .setLabel('Traduire en Français')
                        .setEmoji('🇫🇷')
                        .setStyle(ButtonStyle.Primary),
                );

            const message = await interaction.editReply({ 
                embeds: [initialEmbed], 
                components: [row] 
            });

            // Collecteur de clics sur le bouton (actif pendant 10 minutes)
            const collector = message.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 600000 
            });

            collector.on('collect', async i => {
                if (i.customId === 'translate_fr') {
                    // Désactiver le bouton pendant la traduction
                    await i.update({ content: 'Traduction en cours...', components: [] });

                    try {
                        // Traduction du titre et de l'explication
                        const translatedTitle = await translate(data.title, { to: 'fr' });
                        const translatedExp = await translate(data.explanation, { to: 'fr' });

                        const frenchEmbed = createEmbed(translatedTitle.text, translatedExp.text);
                        frenchEmbed.setColor(0xFFD700); // Or pour différencier
                        frenchEmbed.setFooter({ text: 'Traduit via Google Translate | Source: NASA' });

                        await i.editReply({ 
                            content: '', 
                            embeds: [frenchEmbed], 
                            components: [] // On retire le bouton après traduction
                        });
                    } catch (error) {
                        console.error('Erreur traduction:', error);
                        await i.editReply({ content: 'Erreur lors de la traduction.', components: [] });
                    }
                }
            });

            collector.on('end', () => {
                // Optionnel : Retirer les boutons quand le collecteur expire
                interaction.editReply({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error(`[APOD ERROR]`, error.message);
            await interaction.editReply('Impossible de récupérer les données de la NASA.');
        }
    },
};