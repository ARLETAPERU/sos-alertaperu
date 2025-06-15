// --- JavaScript para Monitor de Sismos y Emergencias (Datos en Tiempo Real) ---

let earthquakeMap = null; // Variable global para almacenar la instancia del mapa
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;
const INIT_RETRY_DELAY = 200; // ms

// Función para inicializar el mapa
function initMap() {
    // Si el mapa ya existe y es una instancia válida de L.Map, lo eliminamos.
    if (earthquakeMap && earthquakeMap instanceof L.Map) {
        earthquakeMap.remove(); 
        console.log("Mapa Leaflet existente eliminado para reinicialización.");
        earthquakeMap = null; // Resetear a null para asegurar una nueva inicialización
    }
    
    // Asegurarse de que el contenedor del mapa existe en el DOM
    const mapElement = document.getElementById('earthquake-map');
    if (!mapElement) {
        console.error("ERROR CRÍTICO: Elemento '#earthquake-map' no encontrado en el DOM. No se puede inicializar el mapa.");
        const seismicInfoSection = document.getElementById('seismic-info');
        if (seismicInfoSection) {
            seismicInfoSection.innerHTML = '<div class="map-error-message">Error al cargar el mapa sísmico. El contenedor del mapa no fue encontrado.</div>';
        }
        return false; // Indicar que la inicialización falló
    }

    // Verificar si el elemento es visible y tiene dimensiones
    const computedStyle = window.getComputedStyle(mapElement);
    const display = computedStyle.getPropertyValue('display');
    const visibility = computedStyle.getPropertyValue('visibility');
    const width = mapElement.offsetWidth;
    const height = mapElement.offsetHeight;

    if (display === 'none' || visibility === 'hidden' || width === 0 || height === 0) {
        console.warn("Advertencia: El elemento '#earthquake-map' está presente pero no es visible o tiene dimensiones cero. Display:", display, "Visibility:", visibility, "Width:", width, "Height:", height);
        // No intentar inicializar si no es visible, ya que Leaflet puede fallar o mostrarse mal
        return false; 
    }

    // Inicializar el mapa
    try {
        earthquakeMap = L.map('earthquake-map').setView([-9.19, -75.015], 3); // Latitud, Longitud, Zoom
        console.log("Mapa Leaflet inicializado correctamente.");

        // Proveedor de tiles: CartoDB Voyager. Este es el único que debería cargarse.
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd', 
            maxZoom: 19
        }).addTo(earthquakeMap);
        console.log("Tiles de CartoDB añadidos al mapa.");
        return true; // Indicar que la inicialización fue exitosa

    } catch (e) {
        console.error("ERROR CRÍTICO: Fallo al crear la instancia de L.map:", e);
        const seismicInfoSection = document.getElementById('seismic-info');
        if (seismicInfoSection) {
            seismicInfoSection.innerHTML = `<div class="map-error-message">Error grave al inicializar el mapa sísmico. Detalles: ${e.message}</div>`;
        }
        earthquakeMap = null; 
        return false; // Indicar que la inicialización falló
    }
}

// Función para verificar la disponibilidad del elemento del mapa y reintentar la inicialización
function checkMapElementAndInit() {
    const mapElement = document.getElementById('earthquake-map');
    if (mapElement && mapElement.offsetWidth > 0 && mapElement.offsetHeight > 0) {
        console.log("Elemento '#earthquake-map' encontrado y visible. Intentando inicializar el mapa.");
        if (initMap()) { // Intentar inicializar y verificar si fue exitoso
            loadRealTimeSeismicData(); // Cargar datos solo si el mapa se inicializó
        }
    } else {
        initAttempts++;
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            console.warn(`Elemento '#earthquake-map' no listo o visible. Reintento ${initAttempts}/${MAX_INIT_ATTEMPTS} en ${INIT_RETRY_DELAY}ms.`);
            setTimeout(checkMapElementAndInit, INIT_RETRY_DELAY);
        } else {
            console.error("Máximo de reintentos alcanzado. No se pudo inicializar el mapa sísmico.");
            const seismicInfoSection = document.getElementById('seismic-info');
            if (seismicInfoSection) {
                seismicInfoSection.innerHTML = '<div class="map-error-message">El mapa sísmico no pudo cargarse después de varios intentos. Verifique su conexión y la configuración del sitio.</div>';
            }
        }
    }
}

// Función principal para obtener y mostrar sismos en el mapa
async function fetchEarthquakes(url, isPeru = false) {
    const mapContainer = document.getElementById('earthquake-map');
    if (!mapContainer) {
        console.error("Contenedor del mapa no disponible para fetchEarthquakes.");
        return;
    }
    
    // Eliminar cualquier mensaje de error/no data previo dentro del contenedor del mapa
    const prevMessage = mapContainer.querySelector('.map-error-message');
    if (prevMessage) prevMessage.remove();

    // Verificación final antes de usar earthquakeMap
    if (!earthquakeMap || !(earthquakeMap instanceof L.Map)) {
        console.warn("El mapa Leaflet no está disponible para cargar sismos en fetchEarthquakes. Es posible que initMap no haya terminado.");
        // No intentamos initMap() aquí, confiamos en checkMapElementAndInit para la inicialización.
        // Si llegamos aquí y el mapa no está listo, algo más fundamental está fallando.
        const errorMessage = document.createElement('p');
        errorMessage.className = 'map-error-message';
        errorMessage.textContent = 'El mapa no se pudo inicializar completamente. Los sismos no se mostrarán.';
        mapContainer.appendChild(errorMessage);
        return; 
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Datos de sismos recibidos (fetch exitoso):", data); 

        // Limpiar marcadores anteriores del mapa
        earthquakeMap.eachLayer(function(layer) {
            if (layer instanceof L.Marker) {
                earthquakeMap.removeLayer(layer);
            }
        });
        console.log("Marcadores de sismos anteriores limpiados.");

        if (data.features && data.features.length > 0) {
            const relevantEarthquakes = data.features.filter(quake => {
                if (isPeru) {
                    const placeLower = quake.properties.place.toLowerCase();
                    const lat = quake.geometry.coordinates[1];
                    const lon = quake.geometry.coordinates[0];
                    const inPeruRegion = (lat >= -25 && lat <= 5 && lon >= -88 && lon <= -60);
                    return placeLower.includes('peru') || placeLower.includes('chile') || 
                           placeLower.includes('ecuador') || placeLower.includes('bolivia') || 
                           placeLower.includes('colombia') || placeLower.includes('brazil') || 
                           placeLower.includes('argentina') || inPeruRegion;
                }
                return true; 
            }).slice(0, 100); 

            if (relevantEarthquakes.length === 0) {
                console.log("No se encontraron sismos relevantes después del filtro.");
                const noDataMessage = document.createElement('p');
                noDataMessage.className = 'map-error-message';
                noDataMessage.textContent = isPeru ? 'No se encontraron sismos recientes para Perú y zonas cercanas.' : 'No se encontraron sismos globales recientes.';
                mapContainer.appendChild(noDataMessage);
            } else {
                console.log(`Se encontraron ${relevantEarthquakes.length} sismos relevantes. Añadiendo marcadores...`);
                relevantEarthquakes.forEach(quake => {
                    const mag = quake.properties.mag; 
                    const place = quake.properties.place;
                    const time = new Date(quake.properties.time).toLocaleString('es-PE', {
                        year: 'numeric', month: 'numeric', day: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    });
                    const depth = quake.geometry.coordinates[2]; 
                    const lat = quake.geometry.coordinates[1];
                    const lon = quake.geometry.coordinates[0];

                    let markerColor = '#28a745'; 
                    if (mag >= 4.5 && mag < 5.5) {
                        markerColor = '#ffc107'; 
                    } else if (mag >= 5.5 && mag < 6.5) {
                        markerColor = '#fd7e14'; 
                    } else if (mag >= 6.5) {
                        markerColor = '#dc3545'; 
                    }

                    const customIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: ${markerColor}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.9em; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);">${mag.toFixed(1)}</div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15] 
                    });

                    const marker = L.marker([lat, lon], { icon: customIcon }).addTo(earthquakeMap);

                    marker.bindPopup(`
                        <strong>Magnitud:</strong> ${mag.toFixed(1)}<br>
                        <strong>Lugar:</strong> ${place}<br>
                        <strong>Fecha/Hora:</strong> ${time}<br>
                        <strong>Profundidad:</strong> ${depth.toFixed(1)} km
                    `);
                });

                const latLngs = relevantEarthquakes.map(q => [q.geometry.coordinates[1], q.geometry.coordinates[0]]);
                if (latLngs.length > 0) { 
                    earthquakeMap.fitBounds(L.latLngBounds(latLngs).pad(0.2)); 
                }
            }

        } else {
            console.log(`La fuente ${url} no contiene datos de sismos en el JSON.`);
            const noDataMessage = document.createElement('p');
            noDataMessage.className = 'map-error-message';
            noDataMessage.textContent = 'No se encontraron sismos recientes para mostrar en la fuente.';
            mapContainer.appendChild(noDataMessage);
        }
    } catch (error) {
        console.error(`Error al cargar o procesar datos de sismos desde ${url}:`, error);
        const errorMessage = document.createElement('p');
        errorMessage.className = 'map-error-message';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
            errorMessage.textContent = 'Error de conexión: No se pudieron cargar los datos sísmicos. Verifica tu conexión a internet.';
        } else {
            errorMessage.textContent = 'Error al procesar los datos de sismos. Inténtalo de nuevo más tarde o verifica la consola para más detalles.';
        }
        mapContainer.appendChild(errorMessage);
    }
}

// Función para cargar todos los datos en tiempo real
function loadRealTimeSeismicData() {
    console.log("Iniciando carga de datos sísmicos en tiempo real...");
    // Fuente de datos del USGS (últimos sismos de magnitud 2.5+ en el día)
    const globalUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
    fetchEarthquakes(globalUrl, false); 

    // Alertas de Emergencia Perú (Manual por ahora)
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
    console.log("DOMContentLoaded disparado. Iniciando chequeo del elemento del mapa...");
    checkMapElementAndInit();
});

// Opcional: Actualizar datos cada cierto tiempo (ej. cada 5 minutos)
// setInterval(loadRealTimeSeismicData, 5 * 60 * 1000);