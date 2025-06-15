// --- JavaScript para Monitor de Sismos y Emergencias (Datos en Tiempo Real) ---
async function fetchEarthquakes(url, elementId, isPeru = false) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const container = document.getElementById(elementId);
        container.innerHTML = ''; // Limpiar contenido anterior

        if (data.features && data.features.length > 0) {
            // Limitar a los 5 sismos más recientes para no saturar
            const latestEarthquakes = data.features.slice(0, 5);

            latestEarthquakes.forEach(quake => {
                const mag = quake.properties.mag.toFixed(1);
                const place = quake.properties.place;
                const time = new Date(quake.properties.time).toLocaleString('es-PE', {
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
                const depth = quake.geometry.coordinates[2].toFixed(1); // Profundidad en km

                // Si es para Perú, intenta filtrar por un lugar que contenga "Peru" o similar
                if (isPeru) {
                    const placeLower = place.toLowerCase();
                    if (!placeLower.includes('peru') && !placeLower.includes('chile') && !placeLower.includes('ecuador') && !placeLower.includes('colombia') && !placeLower.includes('bolivia')) {
                        return; // Saltar si no es de la región relevante
                    }
                }
                
                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>Mag ${mag}</strong> - ${place} (${time}) Prof: ${depth} km`;
                container.appendChild(listItem);
            });
            if (container.innerHTML === '') {
                container.innerHTML = `<li>No se encontraron sismos ${isPeru ? 'en Perú o cercanías' : 'globales'} recientes de magnitud 2.5+.</li>`;
            }
        } else {
            container.innerHTML = `<li>No se encontraron sismos ${isPeru ? 'en Perú o cercanías' : 'globales'} recientes de magnitud 2.5+.</li>`;
        }
    } catch (error) {
        console.error('Error fetching earthquake data:', error);
        const container = document.getElementById(elementId);
        container.innerHTML = `<p style="color: red;">Error al cargar los datos de sismos. Inténtalo de nuevo más tarde.</p>`;
    }
}

function loadRealTimeSeismicData() {
    // Sismos Mundiales (últimos 24h, magnitud 2.5+)
    const globalUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
    fetchEarthquakes(globalUrl, 'global-earthquakes', false);

    // Sismos en Perú y cercanías (últimos 24h, magnitud 2.5+)
    const peruUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
    fetchEarthquakes(peruUrl, 'peru-earthquakes', true);

    // Alertas de Emergencia Perú (Manual por ahora)
    const peruAlertsDiv = document.getElementById('peru-alerts');
    const alerts = [
        "**Alerta:** Simulacro Nacional de Sismo el 28 de junio de 2025. ¡Participa!",
        "**Comunicado:** Lluvias moderadas en la sierra sur hasta el 17 de junio. Tomar precauciones.",
        "**Info:** Curso gratuito de Primeros Auxilios este sábado 21 de junio. ¡Inscríbete en Contacto!"
    ];
    if (alerts.length > 0) {
        peruAlertsDiv.innerHTML = '<h4>Alertas de Emergencia Activas:</h4>';
        alerts.forEach(alertText => {
            const p = document.createElement('p');
            p.innerHTML = alertText;
            peruAlertsDiv.appendChild(p);
        });
    } else {
        peruAlertsDiv.innerHTML = '<p>No hay alertas activas en este momento.</p>';
    }
}

// Cargar los datos sísmicos al cargar la página
document.addEventListener('DOMContentLoaded', loadRealTimeSeismicData);

// Opcional: Actualizar datos cada cierto tiempo (ej: cada 5 minutos)
// setInterval(loadRealTimeSeismicData, 5 * 60 * 1000);