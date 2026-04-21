const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ciel-ce-soir')
        .setDescription('Vérifie si les conditions sont bonnes pour l\'observation (Paris par défaut)')
        .addStringOption(option => 
            option.setName('ville')
                .setDescription('La ville pour la météo (Ex: Paris, Lyon...)')),
    
    async execute(interaction) {
        await interaction.deferReply();

        const lat = 48.8566;
        const lon = 2.3522;

        try {
            const url = `https://www.7timer.info/bin/astro.php?lon=${lon}&lat=${lat}&ac=0&unit=metric&output=json`;
            const response = await axios.get(url);
            const data = response.data.dataseries[0];

            const getStatus = (val) => {
                if (val <= 2) return "🟢 Excellent";
                if (val <= 5) return "🟡 Moyen";
                return "🔴 Mauvais";
            };

            const embed = new EmbedBuilder()
                .setColor(0x1A237E)
                .setTitle(`🔭 Conditions d'observation - Paris`)
                .addFields(
                    { name: '☁️ Couverture Nuageuse', value: getStatus(data.cloudcover), inline: true },
                    { name: '🌀 Transparence', value: getStatus(data.transparency), inline: true },
                    { name: '✨ "Seeing" (Stabilité)', value: getStatus(data.seeing), inline: true },
                    { name: '🌡️ Température', value: `${data.temp2m}°C`, inline: true },
                    { name: '💧 Humidité', value: data.rh2m, inline: true }
                )
                .setDescription("L'indice 'Seeing' mesure la turbulence atmosphérique. Plus il est bas, plus les étoiles sont nettes au télescope.")
                .setFooter({ text: 'Données : 7Timer! Astro Forecast' });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('Impossible de récupérer les prévisions astronomiques.');
        }
    },
};