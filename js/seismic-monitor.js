// --- JavaScript para Monitor de Sismos y Emergencias (Datos en Tiempo Real) ---

let earthquakeMap = null; // Variable global para almacenar la instancia del mapa
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 30; // Aumentar intentos para asegurar que el DOM esté listo
const INIT_RETRY_DELAY = 100; // ms, un retraso más corto para reintentos rápidos

// Función para inicializar el mapa Leaflet
function initMap() {
    const mapElement = document.getElementById('earthquake-map');
    if (!mapElement) {
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            initAttempts++;
            console.warn(`Intento ${initAttempts}/${MAX_INIT_ATTEMPTS}: Elemento '#earthquake-map' no encontrado. Reintentando...`);
            setTimeout(initMap, INIT_RETRY_DELAY);
        } else {
            console.error("ERROR CRÍTICO: Elemento '#earthquake-map' no encontrado después de múltiples intentos. No se puede inicializar el mapa.");
            const seismicInfoSection = document.getElementById('seismic-monitor'); // Usar la sección principal
            if (seismicInfoSection) {
                seismicInfoSection.innerHTML = '<div class="map-error-message">Error al cargar el mapa sísmico: Contenedor no encontrado o no visible.</div>';
            }
        }
        return false;
    }

    // Verificar si el mapa ya existe y es una instancia válida de L.Map, lo eliminamos.
    // Esto es útil si la función se llama varias veces (ej. en desarrollo o por algún error)
    if (earthquakeMap && earthquakeMap instanceof L.Map) {
        earthquakeMap.remove(); 
        console.log("Mapa Leaflet existente eliminado para reinicialización.");
        earthquakeMap = null; // Resetear a null para asegurar una nueva inicialización
    }
    
    // Verificar si el elemento tiene dimensiones y es visible antes de inicializar Leaflet
    const computedStyle = window.getComputedStyle(mapElement);
    if (computedStyle.width === '0px' || computedStyle.height === '0px' || computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            initAttempts++;
            console.warn(`Intento ${initAttempts}/${MAX_INIT_ATTEMPTS}: Elemento '#earthquake-map' no visible o sin dimensiones. Reintentando...`);
            setTimeout(initMap, INIT_RETRY_DELAY);
        } else {
            console.error("ERROR CRÍTICO: Elemento '#earthquake-map' no visible o sin dimensiones después de múltiples intentos. No se puede inicializar el mapa.");
            const seismicInfoSection = document.getElementById('seismic-monitor');
            if (seismicInfoSection) {
                seismicInfoSection.innerHTML = '<div class="map-error-message">Error al cargar el mapa sísmico: Contenedor no visible o con dimensiones incorrectas.</div>';
            }
        }
        return false;
    }

    // Inicializar el mapa
    try {
        earthquakeMap = L.map('earthquake-map').setView([-9.19, -75.01], 5); // Centrado en Perú con un zoom adecuado

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(earthquakeMap);

        console.log("Mapa Leaflet inicializado correctamente.");
        return true;
    } catch (e) {
        console.error("Error al inicializar el mapa Leaflet:", e);
        const seismicInfoSection = document.getElementById('seismic-monitor');
        if (seismicInfoSection) {
            seismicInfoSection.innerHTML = '<div class="map-error-message">Error interno al inicializar el mapa sísmico.</div>';
        }
        return false;
    }
}

// Función para obtener un color de marcador basado en la magnitud
function getMagnitudeColor(magnitude) {
    return magnitude > 6.0 ? '#FF4500' : // Naranja rojizo para fuerte
           magnitude > 5.0 ? '#FF7F50' : // Coral para moderado
           magnitude > 4.0 ? '#FFD700' : // Oro para leve
           '#ADD8E6'; // Azul claro para menor
}

// Función para obtener el radio del círculo basado en la magnitud
function getMagnitudeRadius(magnitude) {
    return Math.sqrt(magnitude) * 8; // Ajusta el multiplicador para un tamaño adecuado
}


// Función para añadir marcadores de sismos al mapa
function addEarthquakeMarkers(earthquakeData, isPeruFiltered = false) {
    if (!earthquakeMap) {
        console.warn("Mapa no inicializado, no se pueden añadir marcadores.");
        return;
    }

    // Limpiar marcadores existentes antes de añadir nuevos
    earthquakeMap.eachLayer(function (layer) {
        if (layer instanceof L.CircleMarker) {
            earthquakeMap.removeLayer(layer);
        }
    });

    earthquakeData.features.forEach(feature => {
        const coords = feature.geometry.coordinates;
        const lat = coords[1];
        const lon = coords[0];
        const magnitude = feature.properties.mag;
        const place = feature.properties.place;
        const time = new Date(feature.properties.time).toLocaleString('es-PE', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const url = feature.properties.url;

        // Filtra por Perú y áreas cercanas solo si isPeruFiltered es true
        // Latitud: -18 a 0 (Perú), Longitud: -82 a -68 (Perú)
        // Ampliado para incluir zonas cercanas que podrían afectar a Perú.
        const isNearPeru = (lat >= -20 && lat <= 2 && lon >= -85 && lon <= -65);

        if (isPeruFiltered && !isNearPeru) {
            return; // Saltar si no está cerca de Perú y el filtro está activo
        }

        const circleMarker = L.circleMarker([lat, lon], {
            radius: getMagnitudeRadius(magnitude),
            fillColor: getMagnitudeColor(magnitude),
            color: '#000',
            weight: 0.5,
            opacity: 1,
            fillOpacity: 0.7
        }).addTo(earthquakeMap);

        circleMarker.bindPopup(`
            <strong>Magnitud:</strong> M${magnitude}<br>
            <strong>Lugar:</strong> ${place}<br>
            <strong>Fecha/Hora:</strong> ${time}<br>
            <a href="${url}" target="_blank">Detalles (USGS)</a>
        `);
    });
    console.log(`Añadidos ${earthquakeData.features.length} sismos al mapa.`);
}


// Función para obtener y mostrar datos de sismos
async function fetchEarthquakes(url, filterForPeruDisplay = false) {
    const earthquakeListDiv = document.getElementById('peru-earthquakes-list');
    if (!earthquakeListDiv) {
        console.warn("Elemento 'peru-earthquakes-list' no encontrado. No se mostrarán los sismos en la lista.");
        return;
    }

    earthquakeListDiv.innerHTML = '<li>Cargando datos sísmicos...</li>';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Filtra los sismos para la lista de Perú
        const peruEarthquakes = data.features.filter(feature => {
            const coords = feature.geometry.coordinates;
            const lat = coords[1];
            const lon = coords[0];
            // Rango geográfico aproximado para Perú y áreas cercanas relevantes (subducción)
            // Latitud: de -20 (sur de Perú/Chile) a 2 (norte de Perú/Ecuador)
            // Longitud: de -85 (océano Pacífico oeste de Perú) a -65 (este de Perú/Bolivia)
            return lat >= -20 && lat <= 2 && lon >= -85 && lon <= -65;
        });

        earthquakeListDiv.innerHTML = ''; // Limpiar el "cargando"

        if (peruEarthquakes.length > 0) {
            peruEarthquakes.sort((a, b) => b.properties.time - a.properties.time); // Ordenar por tiempo descendente
            peruEarthquakes.slice(0, 10).forEach(feature => { // Mostrar solo los últimos 10 en la lista
                const li = document.createElement('li');
                const magnitude = feature.properties.mag;
                const place = feature.properties.place;
                const time = new Date(feature.properties.time).toLocaleString('es-PE', {
                    hour: '2-digit', minute: '2-digit'
                });
                li.innerHTML = `<span class="magnitude">M${magnitude.toFixed(1)}</span> - ${place} (${time})`;
                earthquakeListDiv.appendChild(li);
            });
        } else {
            earthquakeListDiv.innerHTML = '<li>No se encontraron sismos recientes relevantes para Perú.</li>';
        }

        // Añadir todos los sismos al mapa (sin filtrar geográficamente para el mapa global)
        addEarthquakeMarkers(data, filterForPeruDisplay); // El segundo parámetro controla si se filtra para el mapa
        console.log("Datos sísmicos cargados y procesados.");

    } catch (error) {
        console.error('Error fetching earthquake data:', error);
        earthquakeListDiv.innerHTML = '<li>Error al cargar los datos sísmicos. Intente de nuevo más tarde.</li>';
        if (earthquakeMap) {
            earthquakeMap.eachLayer(function (layer) {
                if (layer instanceof L.CircleMarker) {
                    earthquakeMap.removeLayer(layer);
                }
            });
        }
    }
}

// Función principal para cargar todos los datos sísmicos y alertas
function loadRealTimeSeismicData() {
    console.log("Intentando cargar datos sísmicos en tiempo real...");
    if (!initMap()) { // Intenta inicializar el mapa. Si falla (no encontró elemento), no hace nada más.
        console.warn("Mapa no se pudo inicializar, la carga de datos sísmicos se pospone/cancela.");
        return;
    }

    // Datos de sismos del USGS (últimos 2.5 días, magnitud 2.5+)
    const globalUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
    fetchEarthquakes(globalUrl, true); // True para filtrar los que podrían ser de Perú y zonas cercanas para el mapa

    // Alertas de Emergencia Perú (Manual por ahora, como ya lo tenías)
    const peruAlertsDiv = document.getElementById('peru-alerts');
    const alerts = [
        "**Alerta:** Simulacro Nacional de Sismo el 28 de junio de 2025. ¡Participa!",
        "**Comunicado:** Lluvias moderadas en la sierra sur hasta el 17 de junio. Tomar precauciones.",
        "**Info:** Curso gratuito de Primeros Auxilios este sábado 21 de junio. ¡Inscríbete en Contacto!"
    ];
    if (peruAlertsDiv) { // Asegura que el div exista antes de intentar modificarlo
        if (alerts.length > 0) {
            peruAlertsDiv.innerHTML = '<h4>Alertas de Emergencia Activas:</h4>';
            alerts.forEach(alert => {
                const p = document.createElement('p');
                p.innerHTML = alert; // Usar innerHTML para permitir negritas
                peruAlertsDiv.appendChild(p);
            });
        } else {
            peruAlertsDiv.innerHTML = '<p>No hay alertas activas en este momento.</p>';
        }
    } else {
        console.warn("Elemento '#peru-alerts' no encontrado. No se mostrarán las alertas.");
    }
}

// Llamar a la función para verificar el elemento del mapa y luego iniciar todo
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded disparado. Iniciando chequeo del elemento del mapa para inicialización...");
    loadRealTimeSeismicData(); // Iniciar la carga de datos y el mapa
});

// Opcional: Actualizar datos cada cierto tiempo (ej. cada 5 minutos)
// setInterval(loadRealTimeSeismicData, 300 * 1000); // 300 segundos = 5 minutos