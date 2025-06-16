// --- JavaScript para Contadores Dinámicos ---
function animateCounter(id, endValue, duration) {
    const obj = document.getElementById(id);
    if (!obj) return; // Asegúrate de que el elemento existe
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * endValue).toLocaleString('es-PE');
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Ejecutar contadores al cargar la página o al hacer scroll a la sección
document.addEventListener('DOMContentLoaded', () => {
    animateCounter('capacitated-counter', 1200, 2000); // Ejemplo: 1200 personas capacitadas
    animateCounter('at-risk-villages-counter', 85, 2500); // Ejemplo: 85 pueblos en riesgo
    animateCounter('lives-saved-counter', 350, 1500); // Ejemplo: 350 vidas salvadas
});


// --- JavaScript para Efecto de Fondo de Agua ---
const canvas = document.getElementById('waterEffectCanvas');
const ctx = canvas.getContext('2d');
const logoImg = new Image();
logoImg.src = 'img/logo.png'; // Asegúrate de que esta ruta sea correcta

let particles = [];
const numberOfParticles = 30; // Más partículas para un efecto más denso

// Función para obtener un número aleatorio dentro de un rango
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

// Clase para cada "partícula" o gota de agua
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1; // Transparencia
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.008; // Desvanecer con el tiempo
        this.radius *= 0.98; // Encoger con el tiempo
    }
}

// Función para inicializar las partículas
function initParticles() {
    canvas.width = window.innerWidth;
    canvas.height = document.body.scrollHeight; // Cubre toda la altura del contenido del body
    particles = []; // Limpiar partículas existentes al redimensionar

    // Ajustar el número de partículas si la pantalla es más pequeña
    const currentNumberOfParticles = window.innerWidth < 768 ? 15 : numberOfParticles;

    for (let i = 0; i < currentNumberOfParticles; i++) {
        // Posiciones iniciales aleatorias, pero que el logo no las tape
        // Asumiendo que el logo está en la parte superior-izquierda o central-superior
        const x = getRandomArbitrary(0, canvas.width);
        const y = getRandomArbitrary(200, canvas.height); // Empieza más abajo para no chocar con el header/logo

        const radius = getRandomArbitrary(2, 5);
        const color = 'rgba(173, 216, 230, 0.7)'; // Azul claro semitransparente
        const velocity = {
            x: getRandomArbitrary(-0.5, 0.5),
            y: getRandomArbitrary(0.5, 1.5) // Caen hacia abajo
        };
        particles.push(new Particle(x, y, radius, color, velocity));
    }
}

// Animación del efecto de agua
function animateWaterEffect() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas

    // Dibujar el logo en el canvas
    if (logoImg.complete) {
        const logoWidth = 100; // Ancho deseado del logo en el canvas
        const logoHeight = logoImg.naturalHeight * (logoWidth / logoImg.naturalWidth);
        const logoX = 20; // Posición X
        const logoY = 20; // Posición Y

        ctx.globalAlpha = 0.8; // Semi-transparencia para el logo
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
        ctx.globalAlpha = 1; // Restaurar la opacidad global
    }

    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.update();
        particle.draw();

        // Si la partícula se desvanece o sale de la pantalla, la reseteamos
        if (particle.alpha <= 0.05 || particle.radius <= 0.5 || particle.y > canvas.height + particle.radius) {
            particles.splice(i, 1); // Eliminar la partícula
            i--; // Ajustar el índice
            // Añadir una nueva partícula en la parte superior
            const x = getRandomArbitrary(0, canvas.width);
            const y = getRandomArbitrary(0, 100); // Vuelve a aparecer en la parte superior
            const radius = getRandomArbitrary(2, 5);
            const color = 'rgba(173, 216, 230, 0.7)';
            const velocity = {
                x: getRandomArbitrary(-0.5, 0.5),
                y: getRandomArbitrary(0.5, 1.5)
            };
            particles.push(new Particle(x, y, radius, color, velocity));
        }
    }
    requestAnimationFrame(animateWaterEffect);
}

// Inicializar y animar el efecto de agua
window.addEventListener('load', initParticles);
window.addEventListener('resize', initParticles); // Re-inicializar en resize
window.addEventListener('load', animateWaterEffect);


// --- JavaScript para Menú Hamburguesa (Mobile) ---
document.addEventListener('DOMContentLoaded', () => {
    const burgerMenu = document.querySelector('.burger-menu');
    const navLinks = document.querySelector('.nav-links');

    if (burgerMenu && navLinks) {
        burgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('nav-active');
            burgerMenu.classList.toggle('toggle'); // Para animar el icono
        });

        // Cerrar el menú al hacer clic en un enlace (para UX móvil)
        document.querySelectorAll('.nav-links li a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('nav-active')) {
                    navLinks.classList.remove('nav-active');
                    burgerMenu.classList.remove('toggle');
                }
            });
        });
    }
});


// --- JavaScript para Formulario de Contacto Formspree ---
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formStatus = document.getElementById('form-status');
        formStatus.innerHTML = 'Enviando...';
        formStatus.style.color = 'blue';

        const response = await fetch(contactForm.action, {
            method: contactForm.method,
            body: new FormData(contactForm),
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            formStatus.innerHTML = '¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.';
            formStatus.style.color = 'green';
            contactForm.reset();
        } else {
            const data = await response.json();
            if (data.errors) {
                formStatus.innerHTML = data.errors.map(error => error.message).join(", ");
            } else {
                formStatus.innerHTML = '¡Oops! Hubo un problema al enviar tu mensaje.';
            }
            formStatus.style.color = 'red';
        }
    });
}


// --- Código para inicializar la visibilidad del dashboard/login al cargar la página ---
// Este código se asegura de que solo el formulario de login sea visible al inicio.
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginSection = document.getElementById('admin-login');
    const adminPanel = document.getElementById('admin-panel');

    if (adminLoginSection && adminPanel) {
        // Inicialmente, mostrar el login y ocultar el dashboard
        adminLoginSection.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    }
    
    // Si certificates.js está cargado, llamamos a su función para verificar el estado de login
    // Esto es crucial para que el dashboard se muestre si el usuario ya había iniciado sesión.
    if (typeof checkLoginStatus === 'function') { // checkLoginStatus está en certificates.js
        checkLoginStatus(); // Esta función controlará la visibilidad según 'loggedIn'
    } else {
        console.warn("checkLoginStatus function not found. Ensure certificates.js is loaded AFTER script.js if it provides initial setup.");
    }
});