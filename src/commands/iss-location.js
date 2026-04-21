const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iss-location')
        .setDescription('Localise la Station Spatiale Internationale en temps réel'),
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const issUrl = 'http://api.open-notify.org/iss-now.json';
            const issResponse = await axios.get(issUrl);
            const { latitude, longitude } = issResponse.data.iss_position;

            const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`;
            const geoResponse = await axios.get(geoUrl);
            const geoData = geoResponse.data;

            // Détermination du lieu (Pays ou Océan)
            const locationName = geoData.countryName 
                ? `${geoData.countryName} (${geoData.principalSubdivision || 'Région inconnue'})` 
                : "au-dessus de l'Océan 🌊";

            const mapUrl = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${longitude},${latitude}&z=3&l=sat&size=600,300&pt=${longitude},${latitude},pm2rdm`;

            const issEmbed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('🛰️ Position de l\'ISS en direct')
                .setURL('https://www.nasa.gov/international-space-station/')
                .addFields(
                    { name: '📍 Coordonnées', value: `Latitude: \`${latitude}\`\nLongitude: \`${longitude}\``, inline: true },
                    { name: '🌍 Survol actuel', value: locationName, inline: true },
                    { name: '🚀 Vitesse approx.', value: '~27,600 km/h', inline: false }
                )
                .setImage(mapUrl)
                .setTimestamp()
                .setFooter({ text: 'Données : Open-Notify & BigDataCloud' });

            await interaction.editReply({ embeds: [issEmbed] });

        } catch (error) {
            console.error(`[ISS ERROR]`, error.message);
            await interaction.editReply('Erreur lors de la récupération de la position de l\'ISS.');
        }
    },
};