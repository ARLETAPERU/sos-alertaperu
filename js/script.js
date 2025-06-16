// --- JavaScript para Contadores Dinámicos ---
function animateCounter(id, endValue, duration) {
    const obj = document.getElementById(id);
    if (!obj) { // Añadido para evitar errores si el elemento no existe
        console.warn(`Elemento con ID '${id}' no encontrado para animación de contador.`);
        return;
    }
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
    // Solo iniciar si los elementos existen
    if (document.getElementById('capacitated-counter')) animateCounter('capacitated-counter', 1200, 2000); // Ejemplo: 1200 personas capacitadas
    if (document.getElementById('at-risk-villages-counter')) animateCounter('at-risk-villages-counter', 85, 2500); // Ejemplo: 85 pueblos en riesgo
    if (document.getElementById('lives-saved-counter')) animateCounter('lives-saved-counter', 350, 1500); // Ejemplo: 350 vidas salvadas
});


// --- JavaScript para Efecto de Fondo de Agua ---
const canvas = document.getElementById('waterEffectCanvas');
const ctx = canvas.getContext('2d');
const logoImg = new Image();
// Asegúrate de que esta ruta sea correcta para tu logo
logoImg.src = 'img/logo.png'; 

let particles = [];
const numberOfParticles = 30; // Más partículas para un efecto más denso

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function createParticles() {
    particles = []; // Limpiar partículas existentes
    for (let i = 0; i < numberOfParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 5 + 2, // Radio entre 2 y 7
            dx: (Math.random() - 0.5) * 0.5, // Velocidad horizontal más lenta
            dy: (Math.random() - 0.5) * 0.5, // Velocidad vertical más lenta
            alpha: Math.random() * 0.5 + 0.3 // Transparencia entre 0.3 y 0.8
        });
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar solo el canvas de partículas

    // Dibujar el logo con baja opacidad
    if (logoImg.complete && logoImg.naturalHeight !== 0) {
        ctx.save();
        ctx.globalAlpha = 0.05; // Opacidad muy baja para el logo
        const logoWidth = canvas.width * 0.5; // Ajusta el tamaño del logo en el fondo
        const logoHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * logoWidth;
        ctx.drawImage(logoImg, (canvas.width - logoWidth) / 2, (canvas.height - logoHeight) / 2, logoWidth, logoHeight);
        ctx.restore();
    }

    particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;

        // Rebotar en los bordes
        if (p.x + p.radius > canvas.width || p.x - p.radius < 0) {
            p.dx *= -1;
        }
        if (p.y + p.radius > canvas.height || p.y - p.radius < 0) {
            p.dy *= -1;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; // Partículas blancas semi-transparentes
        ctx.fill();
    });

    requestAnimationFrame(animateParticles);
}

// Inicialización del efecto de agua
logoImg.onload = () => {
    resizeCanvas();
    createParticles();
    animateParticles();
};

window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles(); // Regenerar partículas al redimensionar para que se ajusten
});

// En caso de que la imagen ya esté en caché
if (logoImg.complete) {
    resizeCanvas();
    createParticles();
    animateParticles();
}


// --- JavaScript para la Navegación Móvil (Hamburguesa) ---
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Cerrar el menú al hacer clic en un enlace (para dispositivos móviles)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }
});


// --- JavaScript para el formulario de contacto (Formspree) ---
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm && formStatus) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formStatus.innerHTML = 'Enviando...';
        formStatus.style.color = '#3498db'; // Azul para "enviando"

        const response = await fetch(contactForm.action, {
            method: contactForm.method,
            body: new FormData(contactForm),
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            formStatus.innerHTML = '¡Mensaje enviado con éxito! Te contactaremos pronto.';
            formStatus.style.color = '#28a745'; // Verde para éxito
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
    const adminLoginSection = document.getElementById('admin-login'); // Corregido: ID 'admin-login'
    const adminDashboard = document.getElementById('admin-dashboard');

    if (adminLoginSection && adminDashboard) {
        // Inicialmente, mostrar el login y ocultar el dashboard
        adminLoginSection.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
    }
    
    // Si certificates.js está cargado, llamamos a su función para verificar el estado de login
    // Esto es crucial para que el dashboard se muestre si el usuario ya había iniciado sesión.
    // La función checkLoginStatus está ahora en certificates.js
    if (typeof checkLoginStatus === 'function') { 
        checkLoginStatus(); // Esta función controlará la visibilidad según 'loggedIn'
    } else {
        console.warn("checkLoginStatus function not found. Ensure certificates.js is loaded correctly.");
    }
});