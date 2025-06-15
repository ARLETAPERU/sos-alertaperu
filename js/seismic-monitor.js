// --- JavaScript para Monitor de Sismos y Emergencias (Datos en Tiempo Real) ---

// Inicializar el mapa de Leaflet
let earthquakeMap = null; // Variable para almacenar la instancia del mapa

// Función para inicializar el mapa
function initMap() {
    // Si el mapa ya existe, lo eliminamos para evitar duplicados al recargar
    if (earthquakeMap !== null) {
        earthquakeMap.remove(); 
    }
    // Coordenadas iniciales (centro de Perú) y zoom inicial
    // Hemos ajustado el zoom a 3 para que se vean más sismos globales al principio
    earthquakeMap = L.map('earthquake-map').setView([-9.19, -75.015], 3); // Latitud, Longitud, Zoom

    // Proveedor de tiles: CartoDB Voyager (más robusto para HTTPS)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd', // Los subdominios de CartoDB suelen ser a,b,c,d
        maxZoom: 19
    }).addTo(earthquakeMap);
}

// Función principal para obtener y mostrar sismos en el mapa
async function fetchEarthquakes(url, isPeru = false) {
    const mapContainer = document.getElementById('earthquake-map');
    
    // Eliminar cualquier mensaje de error/no data previo
    const prevMessage = mapContainer.querySelector('.map-error-message');
    if (prevMessage) prevMessage.remove();

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Limpiar marcadores anteriores del mapa (si hay alguno de una carga previa)
        earthquakeMap.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                earthquakeMap.removeLayer(layer);
            }
        });

        if (data.features && data.features.length > 0) {
            // Filtrar sismos si es para Perú y zonas cercanas relevantes
            const relevantEarthquakes = data.features.filter(quake => {
                if (isPeru) {
                    const placeLower = quake.properties.place.toLowerCase();
                    const lat = quake.geometry.coordinates[1];
                    const lon = quake.geometry.coordinates[0];
                    // Rango aproximado para la región andina central de Sudamérica
                    // Estos límites pueden necesitar ajuste fino. Ampliados ligeramente.
                    const inPeruRegion = (lat >= -25 && lat <= 5 && lon >= -88 && lon <= -60);
                    return placeLower.includes('peru') || placeLower.includes('chile') || 
                           placeLower.includes('ecuador') || placeLower.includes('bolivia') || 
                           placeLower.includes('colombia') || placeLower.includes('brazil') || 
                           placeLower.includes('argentina') || inPeruRegion;
                }
                return true; // Si no es filtro de Perú, incluye todos
            }).slice(0, 100); // Limitar la cantidad de sismos a mostrar en el mapa (ajusta si quieres más o menos)

            if (relevantEarthquakes.length === 0) { // Quité `&& isPeru` aquí para que muestre el mensaje si el filtro devuelve 0
                console.log("No se encontraron sismos recientes relevantes para el criterio de búsqueda.");
                const noDataMessage = document.createElement('p');
                noDataMessage.className = 'map-error-message';
                noDataMessage.textContent = isPeru ? 'No se encontraron sismos recientes para Perú y zonas cercanas.' : 'No se encontraron sismos globales recientes.';
                mapContainer.appendChild(noDataMessage);
            }

            relevantEarthquakes.forEach(quake => {
                const mag = quake.properties.mag; // No se hace toFixed(1) aquí, se hace en el popup
                const place = quake.properties.place;
                const time = new Date(quake.properties.time).toLocaleString('es-PE', {
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                });
                const depth = quake.geometry.coordinates[2]; // Profundidad en km
                const lat = quake.geometry.coordinates[1];
                const lon = quake.geometry.coordinates[0];

                // Definir color del marcador basado en la magnitud
                let markerColor = '#28a745'; // Verde para magnitud baja (<4.5)
                if (mag >= 4.5 && mag < 5.5) {
                    markerColor = '#ffc107'; // Amarillo para magnitud media
                } else if (mag >= 5.5 && mag < 6.5) {
                    markerColor = '#fd7e14'; // Naranja para magnitud alta
                } else if (mag >= 6.5) {
                    markerColor = '#dc3545'; // Rojo para magnitud muy alta
                }

                // Crear un icono personalizado (div con el número de magnitud)
                const customIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.9em; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);">${mag.toFixed(1)}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15] // Centra el icono
                });

                // Añadir marcador al mapa y bindear un popup con la información
                const marker = L.marker([lat, lon], { icon: customIcon }).addTo(earthquakeMap);

                marker.bindPopup(`
                    <strong>Magnitud:</strong> ${mag.toFixed(1)}<br>
                    <strong>Lugar:</strong> ${place}<br>
                    <strong>Fecha/Hora:</strong> ${time}<br>
                    <strong>Profundidad:</strong> ${depth.toFixed(1)} km
                `);
            });

            // Ajustar el mapa para que se ajusten todos los marcadores visibles (si hay sismos)
            if (relevantEarthquakes.length > 0) {
                const latLngs = relevantEarthquakes.map(q => [q.geometry.coordinates[1], q.geometry.coordinates[0]]);
                earthquakeMap.fitBounds(L.latLngBounds(latLngs).pad(0.2)); // pad añade un margen
            }

        } else {
            console.log(`No se encontraron sismos en la fuente: ${url}`);
            const noDataMessage = document.createElement('p');
            noDataMessage.className = 'map-error-message';
            noDataMessage.textContent = 'No se encontraron sismos recientes para mostrar en la fuente.';
            mapContainer.appendChild(noDataMessage);
        }
    } catch (error) {
        console.error(`Error al cargar datos de sismos desde ${url}:`, error);
        const errorMessage = document.createElement('p');
        errorMessage.className = 'map-error-message';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
            errorMessage.textContent = 'Error de conexión: No se pudieron cargar los datos sísmicos. Verifica tu conexión a internet.';
        } else {
            errorMessage.textContent = 'Error al procesar los datos de sismos. Inténtalo de nuevo más tarde.';
        }
        mapContainer.appendChild(errorMessage);
    }
}

// Función para cargar todos los datos en tiempo real
function loadRealTimeSeismicData() {
    initMap(); // Inicializar el mapa al cargar los datos

    // Fuente de datos del USGS (últimos sismos de magnitud 2.5+ en el día)
    const globalUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
    // *** CAMBIO CLAVE: Cambiado a FALSE para ver sismos globales primero ***
    fetchEarthquakes(globalUrl, false); // FALSE para NO filtrar por Perú, mostrar TODOS los sismos globales

    // Alertas de Emergencia Perú (Manual por ahora, como ya lo tenías)
    const peruAlertsDiv = document.getElementById('peru-alerts');
    const alerts = [
        "**Alerta:** Simulacro Nacional de Sismo el 28 de junio de 2025. ¡Participa!",
        "**Comunicado:** Lluvias moderadas en la sierra sur hasta el 17 de junio. Tomar precauciones.",
        "**Info:** Curso gratuito de Primeros Auxilios este sábado 21 de junio. ¡Inscríbete en Contacto!"
    ];
    if (alerts.length > 0) {
        peruAlertsDiv.innerHTML = '<h4>Alertas de Emergencia Activas:</h4>';
        alerts.forEach(alert => {
            const p = document.createElement('p');
            p.innerHTML = alert;
            peruAlertsDiv.appendChild(p);
        });
    } else {
        peruAlertsDiv.innerHTML = '<p>No hay alertas activas en este momento.</p>';
    }
}

// Llamar a la función para cargar los datos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', loadRealTimeSeismicData);

// Opcional: Actualizar datos cada cierto tiempo (ej. cada 5 minutos)
// setInterval(loadRealTimeSeismicData, 5 * 60 * 1000);