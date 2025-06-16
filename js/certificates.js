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

const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');

const participantNameInput = document.getElementById('participant-name');
const courseTypeSelect = document.getElementById('course-type');
const issueDateInput = document.getElementById('issue-date');
const issueCertificateBtn = document.getElementById('issue-certificate-btn');
const issuedCertificatesList = document.getElementById('issued-certificates-list');

const verifyCodeInput = document.getElementById('verify-code-input');
const verifyCertificateBtn = document.getElementById('verify-certificate-btn');
const verificationResult = document.getElementById('verification-result');


// --- Funciones de Utilidad ---

// Función para guardar certificados en localStorage
function saveCertificates() {
    localStorage.setItem('sosCertificates', JSON.stringify(certificates));
}

// Función para generar un código único de certificado
function generateCertificateCode() {
    return 'CERT-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Función para mostrar / ocultar secciones
function updateUI() {
    if (loggedIn) {
        adminLoginSection.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        renderIssuedCertificates(); // Volver a renderizar al loguearse/desloguearse
    } else {
        adminLoginSection.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        // Limpiar campos de login
        adminUsernameInput.value = '';
        adminPasswordInput.value = '';
        loginMessage.textContent = '';
    }
}

// Función para renderizar la lista de certificados emitidos
function renderIssuedCertificates() {
    issuedCertificatesList.innerHTML = ''; // Limpiar la lista existente
    if (certificates.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay certificados emitidos aún.';
        issuedCertificatesList.appendChild(li);
        return;
    }

    certificates.forEach((cert, index) => {
        const li = document.createElement('li');
        li.classList.add('certificate-item-admin'); // Clase para estilos si es necesario
        li.innerHTML = `
            <span>${cert.name} - ${cert.course} (${cert.code})</span>
            <button class="view-cert-btn btn-secondary" data-code="${cert.code}">Ver</button>
            <button class="delete-cert-btn btn-danger" data-index="${index}">Eliminar</button>
        `;
        issuedCertificatesList.appendChild(li);
    });
}


// --- Event Listeners y Lógica Principal ---

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar certificados desde localStorage al cargar el DOM
    certificates = JSON.parse(localStorage.getItem('sosCertificates')) || [];
    
    // Verificar estado de login (si el usuario ya había iniciado sesión previamente)
    // Esto es importante para mantener la sesión si se recarga la página.
    loggedIn = localStorage.getItem('sosLoggedIn') === 'true';
    updateUI(); // Ajustar la UI según el estado de login inicial

    // Manejo de Login
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            const username = adminUsernameInput.value;
            const password = adminPasswordInput.value;

            if (username === ADMIN_USER && password === ADMIN_PASS) {
                loggedIn = true;
                localStorage.setItem('sosLoggedIn', 'true'); // Guardar estado en localStorage
                loginMessage.textContent = 'Inicio de sesión exitoso.';
                loginMessage.style.color = 'green';
                updateUI();
            } else {
                loggedIn = false;
                localStorage.setItem('sosLoggedIn', 'false');
                loginMessage.textContent = 'Usuario o contraseña incorrectos.';
                loginMessage.style.color = 'red';
            }
        });
    }

    // Manejo de Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            loggedIn = false;
            localStorage.setItem('sosLoggedIn', 'false'); // Limpiar estado de login
            updateUI();
            // Opcional: limpiar la lista de certificados para el admin al desloguearse
            issuedCertificatesList.innerHTML = '';
        });
    }

    // Manejo de Emisión de Certificados
    if (issueCertificateBtn) {
        issueCertificateBtn.addEventListener('click', () => {
            if (!loggedIn) {
                alert('Debes iniciar sesión para emitir certificados.');
                return;
            }

            const name = participantNameInput.value.trim();
            const course = courseTypeSelect.value;
            const date = issueDateInput.value;

            if (name && course && date) {
                const code = generateCertificateCode();
                const newCertificate = {
                    code: code,
                    name: name,
                    course: course,
                    date: date
                };
                certificates.push(newCertificate);
                saveCertificates();
                renderIssuedCertificates();
                alert(`Certificado emitido para ${name} con código: ${code}`);

                // Limpiar formulario
                participantNameInput.value = '';
                courseTypeSelect.value = '';
                issueDateInput.value = '';
            } else {
                alert('Por favor, completa todos los campos para emitir el certificado.');
            }
        });
    }

    // Manejo de Verificación de Certificados (Público)
    if (verifyCertificateBtn) {
        verifyCertificateBtn.addEventListener('click', () => {
            const codeToVerify = verifyCodeInput.value.trim().toUpperCase();
            const foundCert = certificates.find(cert => cert.code === codeToVerify);

            if (foundCert) {
                verificationResult.innerHTML = `
                    <p class="verification-success">✔️ Certificado encontrado y VÁLIDO:</p>
                    <p><strong>Código:</strong> ${foundCert.code}</p>
                    <p><strong>Participante:</strong> ${foundCert.name}</p>
                    <p><strong>Curso:</strong> ${foundCert.course}</p>
                    <p><strong>Fecha de Emisión:</strong> ${foundCert.date}</p>
                    <div id="qrcode-container" class="qr-code-container">
                        <div id="qrcode" style="width:128px; height:128px; margin:0 auto;"></div>
                        <p class="qr-info">Escanea para verificar la autenticidad.</p>
                    </div>
                    <button class="print-certificate-btn btn btn-primary">Imprimir Certificado</button>
                `;
                verificationResult.style.borderColor = 'green';

                // *** CAMBIO CLAVE AQUÍ: Usar un setTimeout para dar tiempo a que el DOM se renderice y la librería QR sea accesible ***
                setTimeout(() => {
                    const qrcodeDiv = document.getElementById("qrcode");
                    if (qrcodeDiv && typeof QRCode !== 'undefined') {
                        // Limpiar el QR anterior si existe
                        qrcodeDiv.innerHTML = ''; // Importante para limpiar el contenido antes de generar uno nuevo
                        new QRCode(qrcodeDiv, {
                            text: window.location.origin + window.location.pathname + "#certificates?code=" + foundCert.code,
                            width: 128,
                            height: 128
                        });
                    } else {
                        console.warn("QRCode library not loaded or #qrcode element not found, cannot generate QR code.");
                        const qrcodeContainer = document.getElementById('qrcode-container');
                        if (qrcodeContainer) {
                            qrcodeContainer.innerHTML = '<p style="color: red;">Error: No se pudo generar el Código QR. Recarga la página o intenta de nuevo.</p>';
                        }
                    }
                }, 50); // Pequeño retraso de 50ms


                // Configurar el botón de impresión
                const printButton = verificationResult.querySelector('.print-certificate-btn');
                if (printButton) {
                    printButton.addEventListener('click', () => {
                        printCertificate(foundCert);
                    });
                }

            } else {
                verificationResult.innerHTML = `
                    <p class="verification-error">❌ Certificado NO encontrado o INVÁLIDO.</p>
                    <p>Por favor, verifica el código e inténtalo de nuevo.</p>
                `;
                verificationResult.style.borderColor = 'red';
            }
        });
    }

    // Manejo de eliminación de certificados (Solo para administradores)
    issuedCertificatesList.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-cert-btn')) {
            if (!loggedIn) {
                alert('No tienes permisos para eliminar certificados.');
                return;
            }
            const indexToDelete = parseInt(event.target.dataset.index);
            if (confirm(`¿Estás seguro de que quieres eliminar el certificado de ${certificates[indexToDelete].name}?`)) {
                certificates.splice(indexToDelete, 1);
                saveCertificates();
                renderIssuedCertificates();
                alert('Certificado eliminado exitosamente.');
            }
        }
    });

    // Manejo de "Ver" certificado desde la lista de administración
    issuedCertificatesList.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-cert-btn')) {
            const codeToView = event.target.dataset.code;
            // Para "ver" desde el admin, simulamos una verificación pública
            verifyCodeInput.value = codeToView;
            verifyCertificateBtn.click(); // Disparamos el clic del botón de verificación
            window.location.hash = '#certificates'; // Asegurarse de que la sección de certificados esté visible
        }
    });

    // Leer el código de certificado de la URL si existe (para compartir el link de verificación)
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
        verifyCodeInput.value = codeFromUrl;
        verifyCertificateBtn.click();
    }
});


// --- Función para Imprimir Certificado ---
function printCertificate(cert) {
    const printContent = `
        <p>Se otorga el presente certificado a:</p>
        <h3>${cert.name}</h3>
        <p>Por haber participado y aprobado el curso de:</p>
        <h4>${cert.course}</h4>
        <p>Realizado el ${cert.date}.</p>
        <p><strong>Código de Verificación:</strong> ${cert.code}</p>
    `;

    const printWindow = window.open('', '_blank', 'height=600,width=800');
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
    printWindow.document.write('<h2>Certificado de Participación</h2>');
    printWindow.document.write(printContent);
    printWindow.document.write('<p style="margin-top: 30px; font-style: italic; text-align: center;">Certificado emitido por SOS ALERTA PERÚ.</p>');
    printWindow.document.write('</div>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}