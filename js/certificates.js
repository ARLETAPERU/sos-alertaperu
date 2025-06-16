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
const adminLoginBtn = document.getElementById('adminLoginForm') ? document.getElementById('adminLoginForm').querySelector('button[type="submit"]') : null;
const loginMessage = document.getElementById('login-message');

const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');

const participantNameInput = document.getElementById('participant-name');
const courseTypeSelect = document.getElementById('course-type');
const issueDateInput = document.getElementById('issue-date');
const issueCertificateBtn = document.getElementById('issue-certificate-btn');
const issuedCertificatesList = document.getElementById('issued-certificates-list');

const verifyCodeInput = document.getElementById('verify-code-input');
const verifyCertificateBtn = document.getElementById('verifyCertificateForm') ? document.getElementById('verifyCertificateForm').querySelector('button[type="submit"]') : null;
const verificationResult = document.getElementById('verification-result');

// Función para cargar certificados desde localStorage
function loadCertificates() {
    const storedCertificates = localStorage.getItem('sosCertificates');
    if (storedCertificates) {
        certificates = JSON.parse(storedCertificates);
    }
    renderIssuedCertificates();
}

// Función para guardar certificados en localStorage
function saveCertificates() {
    localStorage.setItem('sosCertificates', JSON.stringify(certificates));
}

// Función para generar un código único de certificado
function generateCertificateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 3; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code += '-';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Función para renderizar la lista de certificados emitidos
function renderIssuedCertificates() {
    if (!issuedCertificatesList) return; // Asegurarse de que el elemento existe
    issuedCertificatesList.innerHTML = '';
    certificates.forEach((cert, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${cert.name}</strong> - ${cert.course} (${cert.date})<br>
            Código: ${cert.code} 
            <button class="btn-small print-certificate-btn" data-index="${index}">Imprimir</button>
            <button class="btn-small btn-delete" data-index="${index}">Eliminar</button>
        `;
        issuedCertificatesList.appendChild(li);
    });

    // Añadir event listeners a los botones de imprimir
    document.querySelectorAll('.print-certificate-btn').forEach(button => {
        button.onclick = (event) => printCertificate(event.target.dataset.index);
    });

    // Añadir event listeners a los botones de eliminar
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.onclick = (event) => deleteCertificate(event.target.dataset.index);
    });
}

// Función para eliminar un certificado
function deleteCertificate(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este certificado?')) {
        certificates.splice(index, 1);
        saveCertificates();
        renderIssuedCertificates();
    }
}


// Función para imprimir certificado
function printCertificate(index) {
    const cert = certificates[index];
    if (!cert) return;

    const printContent = `
        <h3>Certificado de Participación</h3>
        <p>Se otorga el presente certificado a:</p>
        <h4>${cert.name}</h4>
        <p>Por haber completado satisfactoriamente el curso de:</p>
        <h4>${cert.course}</h4>
        <p>Emitido el: ${cert.date}</p>
        <p>Código de Verificación: <strong>${cert.code}</strong></p>
        <div class="qr-code-container">
            <div id="qrcode"></div>
            <p class="qr-info">Escanea para verificar la autenticidad.</p>
        </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Certificado SOS ALERTA PERÚ</title>');
    printWindow.document.write(`
        <style>
            body { font-family: 'Open Sans', sans-serif; margin: 0; padding: 20px; background-color: #f9f9f9; color: #333; }
            h2, h3, h4 { color: #FF4500; font-family: 'Montserrat', sans-serif; text-align: center; margin-bottom: 10px; }
            p { text-align: center; font-size: 1.1em; margin-bottom: 5px; }
            .qr-code-container { text-align: center; margin-top: 20px; }
            #qrcode { display: block; margin: 20px auto; width: 128px; height: 128px; }
            .qr-info { font-size: 0.9em; color: #666; margin-top: 10px; }
            @media print {
                .qr-code-container { border: none; }
                .print-certificate-btn { display: none; }
            }
        </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div style="border: 2px solid #FF4500; padding: 40px; border-radius: 15px; max-width: 700px; margin: auto;">');
    printWindow.document.write('<img src="img/logo.png" style="width: 150px; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">');
    printWindow.document.write(printContent);
    printWindow.document.write('<p style="margin-top: 30px; font-style: italic; text-align: center;">Certificado emitido por SOS ALERTA PERÚ.</p>');
    printWindow.document.write('</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();

    // Importante: El QR debe generarse DESPUÉS de que la ventana esté abierta y el DOM del popup disponible
    printWindow.onload = () => {
        if (typeof QRCode !== 'undefined') {
            new QRCode(printWindow.document.getElementById("qrcode"), {
                text: cert.code, // El texto del QR es el código del certificado
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            console.error("QRCode.js no está definido. No se puede generar el QR.");
        }
        printWindow.print();
    };
}


// Función para manejar el estado de login y visibilidad
function checkLoginStatus() {
    if (loggedIn) {
        if (adminLoginSection) adminLoginSection.classList.add('hidden');
        if (adminPanel) adminPanel.classList.remove('hidden');
    } else {
        if (adminLoginSection) adminLoginSection.classList.remove('hidden');
        if (adminPanel) adminPanel.classList.add('hidden');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCertificates(); // Cargar certificados al inicio

    // Manejo del formulario de login
    if (document.getElementById('adminLoginForm')) {
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = adminUsernameInput.value;
            const password = adminPasswordInput.value;

            if (username === ADMIN_USER && password === ADMIN_PASS) {
                loggedIn = true;
                loginMessage.textContent = ''; // Limpiar mensaje de error
                checkLoginStatus();
            } else {
                loginMessage.textContent = 'Usuario o contraseña incorrectos.';
                loggedIn = false;
                checkLoginStatus();
            }
        });
    }

    // Manejo del botón de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            loggedIn = false;
            checkLoginStatus();
            adminUsernameInput.value = '';
            adminPasswordInput.value = '';
            loginMessage.textContent = '';
        });
    }

    // Manejo del formulario de emisión de certificados
    if (document.getElementById('issueCertificateForm')) {
        document.getElementById('issueCertificateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = participantNameInput.value.trim();
            const course = courseTypeSelect.value;
            const date = issueDateInput.value;

            if (name && course && date) {
                const newCertificate = {
                    id: certificates.length + 1,
                    name: name,
                    course: course,
                    date: date,
                    code: generateCertificateCode()
                };
                certificates.push(newCertificate);
                saveCertificates();
                renderIssuedCertificates();
                e.target.reset(); // Limpiar el formulario
                alert('Certificado emitido con éxito. Código: ' + newCertificate.code);
            } else {
                alert('Por favor, complete todos los campos para emitir el certificado.');
            }
        });
    }

    // Manejo del formulario de verificación de certificados
    if (document.getElementById('verifyCertificateForm')) {
        document.getElementById('verifyCertificateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const codeToVerify = verifyCodeInput.value.trim().toUpperCase();
            const foundCertificate = certificates.find(cert => cert.code === codeToVerify);

            if (verificationResult) {
                if (foundCertificate) {
                    verificationResult.innerHTML = `
                        <p class="success-message"><strong>Certificado Válido:</strong></p>
                        <p><strong>Participante:</strong> ${foundCertificate.name}</p>
                        <p><strong>Curso:</strong> ${foundCertificate.course}</p>
                        <p><strong>Fecha de Emisión:</strong> ${foundCertificate.date}</p>
                    `;
                    verificationResult.style.color = 'green';
                } else {
                    verificationResult.innerHTML = '<p class="error-message">Certificado no encontrado o código incorrecto.</p>';
                    verificationResult.style.color = 'red';
                }
            }
        });
    }

    // Llamar a checkLoginStatus al cargar para establecer la visibilidad inicial
    checkLoginStatus();
});

// Asegurarse de que el panel de administración se muestre/oculte correctamente cuando se navega a su sección
// Esto es importante si el usuario ya está logueado y recarga la página o navega a otra sección y vuelve.
document.querySelector('a[href="#admin-panel"]').addEventListener('click', () => {
    // Pequeño retardo para asegurar que el DOM se asiente si hay un scroll suave
    setTimeout(() => {
        checkLoginStatus();
    }, 100); 
});