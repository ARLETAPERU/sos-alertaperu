// --- JavaScript para Monitor de Sismos y Emergencias (Datos en Tiempo Real) ---

let earthquakeMap = null; // Variable global para almacenar la instancia del mapa
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 15; // Aumentar un poco los intentos
const INIT_RETRY_DELAY = 300; // ms, un poco más de retraso entre reintentos

// Función para inicializar el mapa Leaflet
function initMap() {
    // Si el mapa ya existe y es una instancia válida de L.Map, lo eliminamos.
    if (earthquakeMap && earthquakeMap instanceof L.Map) {
        earthquakeMap.remove(); 
        console.log("Mapa Leaflet existente eliminado para reinicialización.");
        earthquakeMap = null; // Resetear a null para asegurar una nueva inicialización
    }
    
    const mapElement = document.getElementById('earthquake-map');
    if (!mapElement) {
        // Incrementa los intentos y reintenta si no se encuentra el elemento
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            initAttempts++;
            console.warn(`Elemento '#earthquake-map' no encontrado (intento ${initAttempts}/${MAX_INIT_ATTEMPTS}). Reintentando en ${INIT_RETRY_DELAY}ms...`);
            setTimeout(initMap, INIT_RETRY_DELAY);
            return false;
        } else {
            console.error("ERROR CRÍTICO: Elemento '#earthquake-map' no encontrado en el DOM después de múltiples intentos. No se puede inicializar el mapa.");
            const seismicInfoSection = document.getElementById('seismic-info');
            if (seismicInfoSection) {
                seismicInfoSection.innerHTML = '<div class="map-error-message">Error al cargar el mapa sísmico: Contenedor no encontrado.</div>';
            }
            return false;
        }
    }

    // Verificar si el elemento tiene dimensiones y es visible antes de inicializar Leaflet
    const computedStyle = window.getComputedStyle(mapElement);
    const mapWidth = parseInt(computedStyle.width);
    const mapHeight = parseInt(computedStyle.height);

    if (mapWidth === 0 || mapHeight === 0 || computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            initAttempts++;
            console.warn(`Elemento '#earthquake-map' no visible o sin dimensiones (intento ${initAttempts}/${MAX_INIT_ATTEMPTS}). Reintentando en ${INIT_RETRY_DELAY}ms...`);
            setTimeout(initMap, INIT_RETRY_DELAY);
            return false;
        } else {
            console.error("ERROR CRÍTICO: Elemento '#earthquake-map' no visible o sin dimensiones después de múltiples intentos. No se puede inicializar el mapa.");
            const seismicInfoSection = document.getElementById('seismic-info');
            if (seismicInfoSection) {
                seismicInfoSection.innerHTML = '<div class="map-error-message">Error al cargar el mapa sísmico: Contenedor no visible.</div>';
            }
            return false;
        }
    }

    // Si llegamos aquí, el elemento existe y es visible, proceder con la inicialización
    console.log("Elemento '#earthquake-map' encontrado y visible. Inicializando mapa Leaflet...");
    earthquakeMap = L.map('earthquake-map').setView([-9.19, -75.015], 5); // Coordenadas y zoom centrados en Perú

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(earthquakeMap);
    return true; // Mapa inicializado con éxito
}

// Función para obtener y mostrar datos de sismos
function fetchEarthquakes(url, isGlobal) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Datos de sismos recibidos:", data);
            // Limpiar marcadores anteriores si el mapa existe
            if (earthquakeMap) {
                earthquakeMap.eachLayer(function (layer) {
                    if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                        earthquakeMap.removeLayer(layer);
                    }
                });
            } else {
                // Si el mapa no está inicializado, intenta inicializarlo antes de agregar marcadores
                if (!initMap()) {
                    console.error("No se pudo inicializar el mapa, no se agregarán marcadores de sismos.");
                    return;
                }
            }

            data.features.forEach(feature => {
                const coords = feature.geometry.coordinates; // [long, lat, depth]
                const lat = coords[1];
                const lon = coords[0];
                const magnitude = feature.properties.mag;
                const place = feature.properties.place;
                const time = new Date(feature.properties.time).toLocaleString();
                const url = feature.properties.url;

                // Filtrar solo sismos relevantes para Perú si es la URL global
                if (isGlobal) {
                    // Aproximadamente las coordenadas de Perú (puedes ajustar el bounding box)
                    // Latitud: -18.3 a 0.0
                    // Longitud: -81.5 a -68.5
                    if (lat < -18.3 || lat > 0.0 || lon < -81.5 || lon > -68.5) {
                        return; // Saltar sismos fuera de la región de interés
                    }
                }

                // Determinar color y radio del círculo según la magnitud
                let color = '#0000FF'; // Azul (para magnitudes bajas)
                let radius = 5;
                if (magnitude >= 7) {
                    color = '#FF0000'; // Rojo (sismos muy fuertes)
                    radius = 20;
                } else if (magnitude >= 6) {
                    color = '#FFA500'; // Naranja
                    radius = 15;
                } else if (magnitude >= 5) {
                    color = '#FFFF00'; // Amarillo
                    radius = 10;
                } else if (magnitude >= 3) {
                    color = '#800080'; // Púrpura
                    radius = 7;
                }

                const marker = L.circleMarker([lat, lon], {
                    radius: radius,
                    fillColor: color,
                    color: '#000',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(earthquakeMap);

                marker.bindPopup(`
                    <b>Magnitud:</b> ${magnitude}<br>
                    <b>Lugar:</b> ${place}<br>
                    <b>Hora:</b> ${time}<br>
                    <a href="${url}" target="_blank">Más detalles</a>
                `);
            });
        })
        .catch(error => console.error('Error al obtener datos de sismos:', error));
}

// Función para cargar los datos sísmicos en tiempo real y alertas
function loadRealTimeSeismicData() {
    console.log("loadRealTimeSeismicData se está ejecutando.");
    // Intentar inicializar el mapa. Si tiene éxito, proceder.
    if (!initMap()) {
        console.warn("Retrasando carga de datos sísmicos debido a que el mapa no está listo.");
        return; // Salir si initMap() no pudo inicializar el mapa inmediatamente
    }

    // URL para sismos recientes a nivel global (últimas 2.5 días, magnitud 2.5+)
    const globalUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
    fetchEarthquakes(globalUrl, true); // True para filtrar los que podrían ser de Perú y zonas cercanas para el mapa

    // Alertas de Emergencia Perú (Manual por ahora, como ya lo tenías)
    const peruAlertsDiv = document.getElementById('peru-alerts');
    const alerts = [
        "**Alerta:** Simulacro Nacional de Sismo el 28 de junio de 2025. ¡Participa!",
        "**Comunicado:** Lluvias moderadas en la sierra sur hasta el 17 de junio. Tomar precauciones.",
        "**Info:** Curso gratuito de Primeros Auxilios este sábado 21 de junio. ¡Inscríbete en Contacto!"
    ];
    if (peruAlertsDiv) { 
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
    } else {
        console.warn("Elemento '#peru-alerts' no encontrado. No se mostrarán las alertas.");
    }
}

// Llamar a la función para cargar los datos solo cuando toda la página se haya cargado
// Esto asegura que Leaflet y el div del mapa estén completamente disponibles.
window.addEventListener('load', loadRealTimeSeismicData);

// Opcional: Actualizar datos cada cierto tiempo (ej. cada 5 minutos)
// setInterval(loadRealTimeSeismicData, 300000);