// --- JavaScript para Contadores Dinámicos ---
function animateCounter(id, endValue, duration) {
    const obj = document.getElementById(id);
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

// Ajustar tamaño del canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Llamar al inicio para establecer el tamaño

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 50 + 20; // Tamaño entre 20 y 70
        this.speedX = Math.random() * 0.5 - 0.25; // Velocidad X entre -0.25 y 0.25
        this.speedY = Math.random() * 0.5 - 0.25; // Velocidad Y entre -0.25 y 0.25
        this.opacity = Math.random() * 0.4 + 0.1; // Opacidad entre 0.1 a 0.5 (sutil)
        this.rotation = Math.random() * Math.PI * 2; // Rotación inicial
        this.rotationSpeed = Math.random() * 0.005 - 0.0025; // Velocidad de rotación
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        // Borde envolvente
        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.y < -this.size) this.y = canvas.height + this.size;
        if (this.x > canvas.width + this.size) this.x = -this.size;
        if (this.y > canvas.height + this.size) this.y = -this.size;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        ctx.drawImage(logoImg, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

function initParticles() {
    particles = []; // Limpiar partículas existentes al re-inicializar
    for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpia el canvas en cada frame
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    requestAnimationFrame(draw);
}

// Asegurarse de que la imagen se cargue antes de iniciar el efecto
logoImg.onload = () => {
    initParticles();
    draw(); // Inicia el bucle de animación
};

// Si la imagen ya está en caché, asegurarse de iniciar
if (logoImg.complete) {
    initParticles();
    draw();
}

// --- JavaScript para Formulario de Contacto (usando Formspree) ---
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('form-status');

if (contactForm) { // Asegura que el formulario exista antes de añadir el event listener
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formStatus.innerHTML = 'Enviando...';
        formStatus.style.color = 'var(--color-dark)'; // Color por defecto

        const response = await fetch(contactForm.action, {
            method: contactForm.method,
            body: new FormData(contactForm),
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            formStatus.innerHTML = '¡Mensaje enviado con éxito!';
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
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminDashboard = document.getElementById('admin-dashboard');

    if (adminLoginForm && adminDashboard) {
        // Inicialmente, mostrar el login y ocultar el dashboard
        adminLoginForm.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
    }
    
    // Si certificates.js está cargado, llamamos a su función para verificar el estado de login
    // Esto es crucial para que el dashboard se muestre si el usuario ya había iniciado sesión.
    if (typeof checkLoginStatus === 'function') { // checkLoginStatus está en certificates.js
        checkLoginStatus(); // Esta función controlará la visibilidad según 'loggedIn'
    } else {
        console.warn("checkLoginStatus function not found. Ensure certificates.js is loaded.");
    }
});