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

// --- JavaScript para Sistema de Verificación de Certificados ---
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123'; // ¡ADVERTENCIA: En un entorno de producción, nunca coloques credenciales así en el frontend!
let certificates = JSON.parse(localStorage.getItem('sosCertificates')) || [];
let loggedIn = false;

function saveCertificates() {
    localStorage.setItem('sosCertificates', JSON.stringify(certificates));
}

function generateUniqueCode(course) {
    const year = new Date().getFullYear();
    const courseAbbrMap = {
        "Primeros Auxilios": "PA",
        "Gestion de Riesgos": "GR",
        "Trabajo Altura": "TA",
        "Prevencion Incendios": "PI",
        "Evacuacion": "EV",
        "Seguridad Laboral": "SL"
    };
    const courseAbbr = courseAbbrMap[course] || course.substring(0, 2).toUpperCase(); // Usa el mapa o las primeras 2 letras
    const count = certificates.filter(c => c.code.startsWith(`SOS-${year}-${courseAbbr}`)).length + 1;
    return `SOS-${year}-${courseAbbr}-${String(count).padStart(3, '0')}`;
}

function renderIssuedCertificates() {
    const list = document.getElementById('issued-certificates-list');
    list.innerHTML = '';
    certificates.forEach((cert, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${cert.code}</strong><br>${cert.name} - ${cert.course}</span>
            <button class="btn btn-secondary" onclick="deleteCertificate(${index})">Eliminar</button>
        `;
        list.appendChild(li);
    });
}

function adminLogin() {
    const user = document.getElementById('admin-user').value;
    const pass = document.getElementById('admin-pass').value;
    const status = document.getElementById('login-status');

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        loggedIn = true;
        document.getElementById('admin-login-form').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        status.textContent = '';
        renderIssuedCertificates();
    } else {
        status.textContent = 'Usuario o contraseña incorrectos.';
    }
}

function generateCertificate() {
    const name = document.getElementById('cert-name').value.trim();
    const dni = document.getElementById('cert-dni').value.trim();
    const course = document.getElementById('cert-course').value;
    const date = document.getElementById('cert-date').value;
    const output = document.getElementById('admin-output');

    if (!name || !dni || !course || !date) {
        output.style.color = 'red';
        output.textContent = 'Por favor, completa todos los campos para generar el certificado.';
        return;
    }

    const code = generateUniqueCode(course);
    const newCert = {
        code: code,
        name: name,
        dni: dni,
        course: course,
        issueDate: date,
        status: 'Válido'
    };

    certificates.push(newCert);
    saveCertificates();

    const verificationUrl = `${window.location.origin}${window.location.pathname}?cert_code=${code}#certificates`;

    output.innerHTML = `
        <p style="color: green;">Certificado generado exitosamente:</p>
        <p><strong>Código:</strong> ${code}</p>
        <p><strong>Participante:</strong> ${name}</p>
        <p><strong>Curso:</strong> ${course}</p>
        <p><strong>Fecha:</strong> ${date}</p>
        <p>Escanea el siguiente QR o usa este enlace para verificar:</p>
        <div id="qrcode" style="margin: 10px auto;"></div>
        <a href="${verificationUrl}" target="_blank" class="btn btn-secondary" style="margin-top: 10px;">Verificar Certificado (Enlace)</a>
    `;
    output.style.color = 'var(--color-dark)'; // Color de texto genérico para resultados

    // Limpiar el QR anterior si existe y generar uno nuevo
    document.getElementById("qrcode").innerHTML = '';
    new QRCode(document.getElementById("qrcode"), {
        text: verificationUrl,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    // Limpiar campos del formulario
    document.getElementById('cert-name').value = '';
    document.getElementById('cert-dni').value = '';
    document.getElementById('cert-date').value = '';
    renderIssuedCertificates();
}

function deleteCertificate(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este certificado?')) {
        certificates.splice(index, 1);
        saveCertificates();
        renderIssuedCertificates();
    }
}

function verifyCertificate() {
    const codeInput = document.getElementById('certificate-code').value.trim().toUpperCase();
    const resultDiv = document.getElementById('certificate-result');
    resultDiv.innerHTML = '';

    if (!codeInput) {
        resultDiv.style.color = 'red';
        resultDiv.textContent = 'Por favor, ingresa un código de certificado.';
        return;
    }

    const foundCert = certificates.find(cert => cert.code === codeInput);

    if (foundCert) {
        resultDiv.style.color = 'green';
        resultDiv.innerHTML = `
            <p><strong>Certificado Válido:</strong></p>
            <p><strong>Código:</strong> ${foundCert.code}</p>
            <p><strong>Participante:</strong> ${foundCert.name}</p>
            <p><strong>DNI:</strong> ${foundCert.dni}</p>
            <p><strong>Curso:</strong> ${foundCert.course}</p>
            <p><strong>Fecha de Emisión:</strong> ${foundCert.issueDate}</p>
            <p><strong>Estado:</strong> ${foundCert.status}</p>
        `;
    } else {
        resultDiv.style.color = 'red';
        resultDiv.textContent = 'Certificado no encontrado o no válido.';
    }
}

// Manejar el precargado del código si viene de un QR (URL con parámetro cert_code)
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const certCode = urlParams.get('cert_code');
    if (certCode) {
        document.getElementById('certificate-code').value = certCode;
        verifyCertificate();
    }
});


// --- JavaScript para Monitor de Sismos (Simulado, para integración futura) ---
// En una aplicación real, estas funciones harían llamadas a APIs de sismología.
// Ejemplos de APIs: USGS Earthquake Hazards Program (global), IGP (Perú) para datos más precisos y en tiempo real.
function loadSeismicData() {
    const peruEarthquakes = [
        { mag: 4.2, loc: "Arequipa", date: "14/06/2025 18:30", depth: "30 km" },
        { mag: 3.8, loc: "Cusco", date: "14/06/2025 10:15", depth: "55 km" },
        { mag: 4.5, loc: "Ica", date: "13/06/2025 22:00", depth: "40 km" },
    ];

    const globalEarthquakes = [
        { mag: 6.1, loc: "Indonesia", date: "14/06/2025 15:45", depth: "10 km" },
        { mag: 5.7, loc: "Alaska, USA", date: "14/06/2025 08:00", depth: "25 km" },
        { mag: 7.0, loc: "Japón", date: "13/06/2025 03:20", depth: "60 km" },
    ];

    const peruAlerts = [
        "Alerta de lluvias intensas en la sierra sur (SENAMHI).",
        "Cierre de ruta por deslizamiento en Huarochirí (INDECI).",
        "Simulacro Nacional de Sismo el 28 de junio."
    ];

    const peruDiv = document.getElementById('peru-earthquakes');
    peruDiv.innerHTML = '<h4>Sismos Recientes en Perú:</h4>';
    peruEarthquakes.forEach(sismo => {
        peruDiv.innerHTML += `<p><strong>${sismo.mag} Mw</strong> - ${sismo.loc} (${sismo.date}) - Profundidad: ${sismo.depth}</p>`;
    });

    const globalDiv = document.getElementById('global-earthquakes');
    globalDiv.innerHTML = '<h4>Sismos Recientes a Nivel Mundial:</h4>';
    globalEarthquakes.forEach(sismo => {
        globalDiv.innerHTML += `<p><strong>${sismo.mag} Mw</strong> - ${sismo.loc} (${sismo.date}) - Profundidad: ${sismo.depth}</p>`;
    });

    const alertsDiv = document.getElementById('peru-alerts');
    alertsDiv.innerHTML = '<h4>Alertas de Emergencia Activas:</h4>';
    if (peruAlerts.length > 0) {
        peruAlerts.forEach(alert => {
            alertsDiv.innerHTML += `<p>- ${alert}</p>`;
        });
    } else {
        alertsDiv.innerHTML += `<p>No hay alertas activas en este momento.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', loadSeismicData); // Cargar al inicio

// --- JavaScript para Formulario de Contacto (usando Formspree) ---
// Nota: Necesitarás configurar un formulario en Formspree.io y reemplazar 'your_form_id'
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('form-status');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formStatus.textContent = 'Enviando...';
    formStatus.style.color = 'gray';

    const formData = new FormData(contactForm);
    const response = await fetch(contactForm.action, {
        method: contactForm.method,
        body: formData,
        headers: {
            'Accept': 'application/json'
        }
    });

    if (response.ok) {
        formStatus.textContent = '¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.';
        formStatus.style.color = 'green';
        contactForm.reset();
    } else {
        const data = await response.json();
        if (data.errors) {
            formStatus.textContent = data.errors.map(error => error.message).join(", ");
        } else {
            formStatus.textContent = '¡Oops! Hubo un problema al enviar tu mensaje.';
        }
        formStatus.style.color = 'red';
    }
});