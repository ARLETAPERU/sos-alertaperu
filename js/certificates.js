// --- JavaScript para Sistema de Verificación de Certificados ---
// !!! ADVERTENCIA: Para producción, NO ALMACENAR CREDENCIALES EN EL CLIENTE.
// Se necesitaría un backend para autenticación segura.
var ADMIN_USER = 'Jonnazz28'; // ¡Usuario Actualizado!
var ADMIN_PASS = 'Jonnazz28..*'; // ¡Contraseña Actualizada!

let certificates = []; // Inicializamos como array vacío, se llenará desde localStorage en DOMContentLoaded
let loggedIn = false;

// Elementos del DOM (variables globales para fácil acceso)
const adminLoginSection = document.getElementById('admin-login');
const adminUsernameInput = document.getElementById('admin-username');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginBtn = document.getElementById('admin-login-btn');
const loginMessage = document.getElementById('login-message');

const adminPanel = document.getElementById('admin-dashboard'); // Corregido ID
const logoutBtn = document.getElementById('logout-btn');

const participantNameInput = document.getElementById('participant-name');
const courseTypeSelect = document.getElementById('course-type');
const issueDateInput = document.getElementById('issue-date');
const issueCertificateBtn = document.getElementById('issue-certificate-btn');
const issuedCertificatesList = document.getElementById('issued-certificates-list');
const issueStatusMessage = document.getElementById('issue-status');

const verifyCodeInput = document.getElementById('certificateCodeInput'); // Corregido ID
const verifyCertificateBtn = document.getElementById('verify-certificate-btn');
const verificationResult = document.getElementById('verification-result');

// Cargar certificados de localStorage al inicio
document.addEventListener('DOMContentLoaded', () => {
    const storedCertificates = localStorage.getItem('sosCertificates');
    if (storedCertificates) {
        try {
            certificates = JSON.parse(storedCertificates);
            renderCertificates();
        } catch (e) {
            console.error("Error parsing certificates from localStorage:", e);
            certificates = [];
        }
    } else {
        certificates = []; // Asegura que sea un array vacío si no hay nada en localStorage
    }

    // Inicializar estado de login (solo si la página tiene el panel de admin)
    checkLoginStatus();

    // Comprobar si hay un código en la URL para verificación directa
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const verifyCodeFromUrl = urlParams.get('verify');
    if (verifyCodeFromUrl) {
        verifyCodeInput.value = verifyCodeFromUrl;
        verifyCertificate(verifyCodeFromUrl);
        // Desplazarse a la sección de certificaciones
        document.getElementById('certifications').scrollIntoView({ behavior: 'smooth' });
    }
});


// Función para generar un código único para el certificado
function generateCertificateCode() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `SOS-${timestamp}-${random}`.toUpperCase();
}

// Renderizar la lista de certificados en el dashboard
function renderCertificates() {
    if (!issuedCertificatesList) {
        console.warn("Elemento 'issued-certificates-list' no encontrado. No se renderizarán los certificados.");
        return;
    }
    issuedCertificatesList.innerHTML = ''; // Limpiar lista
    if (certificates.length === 0) {
        issuedCertificatesList.innerHTML = '<li>No hay certificados emitidos.</li>';
        return;
    }

    certificates.forEach((cert, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${cert.participantName}</strong> (${cert.courseType})<br>
                Código: <span class="cert-code">${cert.code}</span><br>
                Fecha: ${cert.issueDate}
            </div>
            <div class="certificate-actions">
                <button class="btn btn-primary btn-small print-certificate-btn" data-index="${index}">Imprimir</button>
                <button class="btn btn-secondary btn-small delete-certificate-btn" data-index="${index}">Eliminar</button>
            </div>
        `;
        issuedCertificatesList.appendChild(li);
    });

    // Añadir event listeners a los botones de imprimir y eliminar
    document.querySelectorAll('.print-certificate-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            printCertificate(certificates[index]);
        });
    });

    document.querySelectorAll('.delete-certificate-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            if (confirm(`¿Estás seguro de que quieres eliminar el certificado de ${certificates[index].participantName}?`)) {
                certificates.splice(index, 1);
                localStorage.setItem('sosCertificates', JSON.stringify(certificates));
                renderCertificates();
            }
        });
    });
}

// Lógica de inicio de sesión
if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const username = adminUsernameInput.value;
        const password = adminPasswordInput.value;

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            loggedIn = true;
            localStorage.setItem('loggedIn', 'true'); // Persistir el estado de login
            loginMessage.textContent = '';
            checkLoginStatus(); // Actualiza la UI
            alert('¡Inicio de sesión exitoso!');
        } else {
            loginMessage.textContent = 'Usuario o contraseña incorrectos.';
            loginMessage.style.color = 'red';
        }
    });
}

// Lógica de cierre de sesión
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        loggedIn = false;
        localStorage.removeItem('loggedIn'); // Eliminar el estado de login
        checkLoginStatus(); // Actualiza la UI
        alert('Sesión cerrada.');
    });
}

// Función para verificar el estado de login y mostrar/ocultar secciones
function checkLoginStatus() {
    loggedIn = localStorage.getItem('loggedIn') === 'true';

    if (adminLoginSection && adminPanel) {
        if (loggedIn) {
            adminLoginSection.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            renderCertificates(); // Cargar y mostrar certificados al logearse
        } else {
            adminLoginSection.classList.remove('hidden');
            adminPanel.classList.add('hidden');
            adminUsernameInput.value = '';
            adminPasswordInput.value = '';
            loginMessage.textContent = '';
        }
    }
}

// Lógica para emitir certificado
if (issueCertificateForm) {
    issueCertificateForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const participantName = participantNameInput.value.trim();
        const courseType = courseTypeSelect.value;
        const issueDate = issueDateInput.value;

        if (!participantName || !courseType || !issueDate) {
            issueStatusMessage.textContent = 'Por favor, complete todos los campos.';
            issueStatusMessage.style.color = 'red';
            return;
        }

        const newCertificate = {
            code: generateCertificateCode(),
            participantName,
            courseType,
            issueDate,
            issuedBy: 'SOS ALERTA PERÚ', // Puedes hacer esto dinámico si hay múltiples emisores
            timestamp: new Date().toISOString()
        };

        certificates.push(newCertificate);
        localStorage.setItem('sosCertificates', JSON.stringify(certificates));

        issueStatusMessage.textContent = `Certificado para ${participantName} emitido con código: ${newCertificate.code}`;
        issueStatusMessage.style.color = 'green';
        issueCertificateForm.reset();
        renderCertificates(); // Actualizar la lista

        // Opcional: imprimir automáticamente el certificado después de emitir
        // printCertificate(newCertificate);
    });
}

// Lógica para verificar certificado
if (verifyCertificateForm) {
    verifyCertificateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = verifyCodeInput.value.trim().toUpperCase();
        verifyCertificate(code);
    });
}

function verifyCertificate(code) {
    if (!verificationResult) {
        console.warn("Elemento 'verification-result' no encontrado.");
        return;
    }

    if (!code) {
        verificationResult.innerHTML = '<p class="error-message">Por favor, ingrese un código de certificado.</p>';
        verificationResult.classList.remove('valid', 'invalid');
        return;
    }

    const foundCertificate = certificates.find(cert => cert.code === code);

    if (foundCertificate) {
        verificationResult.classList.remove('invalid');
        verificationResult.classList.add('valid');
        verificationResult.innerHTML = `
            <h4>Certificado Verificado</h4>
            <p><strong>Código:</strong> ${foundCertificate.code}</p>
            <p><strong>Participante:</strong> ${foundCertificate.participantName}</p>
            <p><strong>Tipo de Curso:</strong> ${foundCertificate.courseType}</p>
            <p><strong>Fecha de Emisión:</strong> ${foundCertificate.issueDate}</p>
            <p><strong>Emitido por:</strong> ${foundCertificate.issuedBy}</p>
            <p style="font-style: italic; font-size: 0.9em;">Este certificado es válido y auténtico.</p>
        `;
    } else {
        verificationResult.classList.remove('valid');
        verificationResult.classList.add('invalid');
        verificationResult.innerHTML = `
            <h4>Verificación Fallida</h4>
            <p>El código <strong>${code}</strong> no corresponde a ningún certificado emitido por SOS ALERTA PERÚ.</p>
            <p style="font-style: italic; font-size: 0.9em;">Por favor, verifique el código e intente de nuevo.</p>
        `;
    }
}


// Función para imprimir el certificado con QR
function printCertificate(certificate) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Certificado SOS ALERTA PERÚ</title>');
    printWindow.document.write(`
        <style>
            body { font-family: 'Open Sans', sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; color: #333; }
            h2, h3, h4 { color: #FF4500; font-family: 'Montserrat', sans-serif; text-align: center; margin-bottom: 10px; }
            p { text-align: center; font-size: 1.1em; margin-bottom: 5px; }
            .qr-code-container { text-align: center; margin-top: 20px; border: 1px solid #ddd; padding: 10px; display: inline-block; border-radius: 8px; background-color: #fff; }
            #qrcode-print { display: block; margin: 0 auto; } /* Ajustado para que el QR se centre dentro de su contenedor */
            .qr-info { font-size: 0.9em; color: #666; margin-top: 10px; }
            @media print {
                .qr-code-container { border: none; }
                .print-certificate-btn { display: none; }
            }
        </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div style="border: 2px solid #FF4500; padding: 40px; border-radius: 15px; max-width: 700px; margin: auto; background-color: #ffffff; box-shadow: 0 0 15px rgba(0,0,0,0.1);">');
    printWindow.document.write('<img src="img/logo.png" style="width: 150px; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;" alt="SOS ALERTA PERÚ Logo">');
    printWindow.document.write('<h2>Certificado de Participación</h2>');
    printWindow.document.write(`<p style="font-size: 1.2em; margin-top: 20px;">Se otorga a:</p>`);
    printWindow.document.write(`<h3 style="font-size: 2em; color: #3498db; margin-top: 10px;">${certificate.participantName}</h3>`);
    printWindow.document.write(`<p style="margin-top: 20px;">Por su destacada participación y culminación exitosa del curso de:</p>`);
    printWindow.document.write(`<p style="font-size: 1.3em; font-weight: bold; color: #FF4500;">${certificate.courseType}</p>`);
    printWindow.document.write(`<p style="margin-top: 20px;">Emitido el: ${certificate.issueDate}</p>`);
    printWindow.document.write(`<p style="margin-top: 30px; font-style: italic;">Código de Certificado: <strong>${certificate.code}</strong></p>`);
    
    // Contenedor para el QR Code
    printWindow.document.write('<div class="qr-code-container">');
    printWindow.document.write('<div id="qrcode-print"></div>'); // ID para el QR en la ventana de impresión
    printWindow.document.write('<p class="qr-info">Escanee para verificar la autenticidad del certificado.</p>');
    printWindow.document.write('</div>'); // Cierra qr-code-container

    printWindow.document.write('<p style="margin-top: 30px; font-style: italic; font-size: 0.9em;">Certificado emitido por SOS ALERTA PERÚ.</p>');
    printWindow.document.write('</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Cargar qrcode.min.js en la ventana de impresión dinámicamente
    const script = printWindow.document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; // Usar CDN para consistencia
    script.onload = () => {
        // Asegúrate de que QRCode esté disponible en el objeto printWindow
        if (printWindow.QRCode) {
            new printWindow.QRCode(printWindow.document.getElementById('qrcode-print'), {
                text: window.location.origin + '/#certifications?verify=' + certificate.code, // URL completa para verificación
                width: 128,
                height: 128,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : printWindow.QRCode.CorrectLevel.H
            });
            console.log("QR code generated successfully in print window.");
        } else {
            console.error("QRCode object not found in print window after script load.");
        }
    };
    script.onerror = () => {
        console.error("Failed to load qrcode.min.js in print window.");
    };
    printWindow.document.head.appendChild(script);

    // Dar un pequeño retraso antes de imprimir para permitir que el QR se renderice
    setTimeout(() => {
        printWindow.print();
    }, 700); // Aumentado el retraso ligeramente
}