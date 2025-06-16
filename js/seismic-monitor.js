// --- JavaScript para Monitor de Sismos y Emergencias (Datos en Tiempo Real) ---

let earthquakeMap = null; // Variable global para almacenar la instancia del mapa
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 15; // Aumentar un poco los intentos
const INIT_RETRY_DELAY = 300; // ms, un poco más de retraso entre reintentos

// Coordenadas aproximadas para Perú y un área circundante relevante
const PERU_BOUNDS = {
    minLat: -19.0, maxLat: -0.0,  // Latitud: de sur a norte de Perú
    minLon: -82.0, maxLon: -68.0 // Longitud: de oeste a este de Perú (incluyendo un poco del océano y el Amazonas)
};

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
        console.error("ERROR CRÍTICO: Elemento '#earthquake-map' no encontrado en el DOM. No se puede inicializar el mapa.");
        const seismicInfoSection = document.getElementById('seismic-info');
        if (seismicInfoSection) {
            seismicInfoSection.innerHTML = '<div class="map-error-message">Error al cargar el mapa sísmico: Contenedor no encontrado.</div>';
        }
        return false;
    }

    // Verificar si el elemento tiene dimensiones y es visible antes de inicializar Leaflet
    const computedStyle = window.getComputedStyle(mapElement);
    const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && computedStyle.width !== '0px' && computedStyle.height !== '0px';

    if (!isVisible) {
        console.warn(`Elemento '#earthquake-map' no es visible o no tiene dimensiones. Reintentando en ${INIT_RETRY_DELAY}ms (Intento ${initAttempts + 1}/${MAX_INIT_ATTEMPTS}).`);
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            initAttempts++;
            setTimeout(initMap, INIT_RETRY_DELAY);
        } else {
            console.error("Máximo de reintentos alcanzado. El mapa no se pudo inicializar debido a que el contenedor no está listo.");
            const seismicInfoSection = document.getElementById('seismic-info');
            if (seismicInfoSection) {
                seismicInfoSection.innerHTML = '<div class="map-error-message">Error al cargar el mapa sísmico: Contenedor del mapa no está visible o tiene tamaño cero.</div>';
            }
        }
        return false;
    }

    // Inicializar el mapa si el elemento es válido y visible
    earthquakeMap = L.map('earthquake-map').setView([-9.19, -75.01], 5); // Centrado en Perú

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(earthquakeMap);

    console.log("Mapa Leaflet inicializado con éxito.");
    initAttempts = 0; // Resetear intentos al éxito
    return true;
}

// Función para determinar el color del círculo según la magnitud
function getMagnitudeColor(magnitude) {
    if (magnitude >= 7.0) return 'red';
    if (magnitude >= 6.0) return 'orangered';
    if (magnitude >= 5.0) return 'orange';
    if (magnitude >= 4.0) return 'gold';
    if (magnitude >= 3.0) return 'yellowgreen';
    return 'green';
}

// Función para determinar el radio del círculo según la magnitud
function getMagnitudeRadius(magnitude) {
    return Math.pow(magnitude, 2) * 2; // Escala no lineal para mejor visualización
}

// Función para obtener y mostrar los últimos sismos
async function fetchEarthquakes(url, filterForPeruMap = false) {
    console.log(`Fetching earthquakes from: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Earthquake data fetched:", data);

        // Limpiar capas existentes si el mapa ya está inicializado
        if (earthquakeMap) {
            earthquakeMap.eachLayer(function (layer) {
                if (layer instanceof L.CircleMarker) {
                    earthquakeMap.removeLayer(layer);
                }
            });
        }
        
        let peruEarthquakeFound = false;
        let globalQuakesCount = 0;

        data.features.forEach(feature => {
            const coords = feature.geometry.coordinates;
            const lat = coords[1];
            const lon = coords[0];
            const magnitude = feature.properties.mag;
            const place = feature.properties.place;
            const time = new Date(feature.properties.time).toLocaleString();

            if (magnitude === null) {
                console.log("Sismo con magnitud nula, omitiendo:", feature);
                return;
            }

            // Filtrar sismos para mostrar en el mapa de Perú si se requiere
            const isNearPeru = lat >= PERU_BOUNDS.minLat && lat <= PERU_BOUNDS.maxLat &&
                               lon >= PERU_BOUNDS.minLon && lon <= PERU_BOUNDS.maxLon;

            if (filterForPeruMap) {
                if (isNearPeru && earthquakeMap) {
                    L.circleMarker([lat, lon], {
                        radius: getMagnitudeRadius(magnitude),
                        fillColor: getMagnitudeColor(magnitude),
                        color: '#000',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.7
                    }).addTo(earthquakeMap)
                      .bindPopup(`<strong>Mag: ${magnitude}</strong><br>${place}<br>${time}`);
                    peruEarthquakeFound = true;
                }
            } else {
                globalQuakesCount++;
            }
        });

        // Actualizar el último sismo en Perú (simulado con IGP)
        // Usamos un endpoint de IGP si estuviera disponible, por ahora sigue estático
        const latestPeruQuakeDiv = document.getElementById('latest-earthquake');
        if (latestPeruQuakeDiv) {
            // Simulación de datos del IGP. En un caso real, esto vendría de una API del IGP.
            const sismoIGP = {
                magnitud: 4.5,
                ubicacion: "45 km al SO de Ica",
                fecha: "15/06/2025",
                hora: "14:30:15 HLG",
                profundidad: "40 km",
                lat: -14.3,
                lon: -76.0
            };

            latestPeruQuakeDiv.innerHTML = `
                <h4>Último Sismo en Perú (IGP):</h4>
                <p><strong>Magnitud:</strong> ${sismoIGP.magnitud} Mw</p>
                <p><strong>Ubicación:</strong> ${sismoIGP.ubicacion}</p>
                <p><strong>Fecha y Hora:</strong> ${sismoIGP.fecha} ${sismoIGP.hora}</p>
                <p><strong>Profundidad:</strong> ${sismoIGP.profundidad}</p>
                <p><small>Datos simulados. En un entorno real se integrarían APIs del IGP.</small></p>
            `;
        }

        // Actualizar el resumen de sismos globales
        const globalSummaryDiv = document.getElementById('global-earthquakes-summary');
        if (globalSummaryDiv) {
            globalSummaryDiv.innerHTML = `
                <h4>Sismos Globales Recientes (USGS, últimas 2.5 días):</h4>
                <p>Total de sismos reportados: ${data.features.length}</p>
                <p>Se muestran los sismos cercanos a Perú en el mapa.</p>
            `;
        }

        if (filterForPeruMap && earthquakeMap && !peruEarthquakeFound) {
            console.log("No se encontraron sismos recientes cerca de Perú en los datos de USGS para mostrar en el mapa.");
        }

    } catch (error) {
        console.error("Error fetching earthquake data:", error);
        const latestPeruQuakeDiv = document.getElementById('latest-earthquake');
        if (latestPeruQuakeDiv) {
            latestPeruQuakeDiv.innerHTML = '<h4>Último Sismo en Perú (IGP):</h4><p class="error-message">Error al cargar datos del sismo. Intente de nuevo más tarde.</p>';
        }
        const globalSummaryDiv = document.getElementById('global-earthquakes-summary');
        if (globalSummaryDiv) {
            globalSummaryDiv.innerHTML = '<h4>Sismos Globales Recientes (USGS):</h4><p class="error-message">Error al cargar datos globales. Intente de nuevo más tarde.</p>';
        }
    }
}


// Función principal para cargar datos sísmicos y alertas
function loadRealTimeSeismicData() {
    // Cargar sismos globales (últimas 2.5 días)
    const globalUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_2.5_day.geojson';
    fetchEarthquakes(globalUrl, true); // True para filtrar los que podrían ser de Perú y zonas cercanas para el mapa

    // Alertas de Emergencia Perú (Datos estáticos por ahora)
    const peruAlertsDiv = document.getElementById('peru-alerts');
    const alerts = [
        "**Alerta:** Simulacro Nacional de Sismo el 28 de junio de 2025. ¡Participa!",
        "**Comunicado:** Lluvias moderadas en la sierra sur hasta el 17 de junio. Tomar precauciones.",
        "**Info:** Curso gratuito de Primeros Auxilios este sábado 21 de junio. ¡Inscríbete en Contacto! "
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

// Llamar a la función para verificar el elemento del mapa y luego iniciar todo
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded disparado. Iniciando chequeo del elemento del mapa para inicialización...");
    // Intentar inicializar el mapa inmediatamente
    if (initMap()) {
        loadRealTimeSeismicData();
    }
    // Opcional: Actualizar datos cada cierto tiempo (ej. cada 5 minutos)
    setInterval(loadRealTimeSeismicData, 300000); // 300000 ms = 5 minutos
});

// Listener para cuando la sección del monitor sísmico se hace visible (si el mapa no se inicializó antes)
const seismicMonitorSection = document.getElementById('seismic-monitor');
if (seismicMonitorSection) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!earthquakeMap) { // Solo intentar inicializar si no está ya inicializado
                    console.log("Sección del monitor sísmico visible. Intentando inicializar el mapa...");
                    if (initMap()) {
                        loadRealTimeSeismicData();
                    }
                }
            }
        });
    }, { threshold: 0.1 }); // Dispara cuando el 10% de la sección es visible

    observer.observe(seismicMonitorSection);
}