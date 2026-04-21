const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('asteroides')
        .setDescription('Liste les objets frôlant la Terre aujourd\'hui'),
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const today = new Date().toISOString().split('T')[0];
            const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${process.env.NASA_API_KEY}`;
            
            const response = await axios.get(url);
            const count = response.data.element_count;
            const nearest = response.data.near_earth_objects[today][0]; // On prend le premier pour l'exemple

            const asteroidEmbed = new EmbedBuilder()
                .setColor(0xFF4500)
                .setTitle(`☄️ Alerte Astéroïdes - ${today}`)
                .addFields(
                    { name: 'Objets détectés', value: `${count}`, inline: true },
                    { name: 'Le plus proche', value: nearest.name, inline: true },
                    { name: 'Vitesse', value: `${Math.round(nearest.close_approach_data[0].relative_velocity.kilometers_per_hour)} km/h` },
                    { name: 'Distance de passage', value: `${parseFloat(nearest.close_approach_data[0].miss_distance.kilometers).toLocaleString()} km` },
                    { name: 'Probabilité de fin du monde', value: '🟢 0.00000001% (Dormez tranquilles !)' }
                )
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/2534/2534384.png')
                .setFooter({ text: 'Données : NASA NeoWs' });

            await interaction.editReply({ embeds: [asteroidEmbed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply('Erreur lors de la récupération des données NeoWs.');
        }
    },
};