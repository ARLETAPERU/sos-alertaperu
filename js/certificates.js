// --- JavaScript para Sistema de Verificación de Certificados ---
// !!! ADVERTENCIA: Para producción, NO ALMACENAR CREDENCIALES EN EL CLIENTE.
// Se necesitaría un backend para autenticación segura.
var ADMIN_USER = 'admin';
var ADMIN_PASS = 'admin123';

let certificates = JSON.parse(localStorage.getItem('sosCertificates')) || [];
let loggedIn = false;

// Elementos del DOM
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const adminLoginForm = document.getElementById('adminLoginForm');
const loginError = document.getElementById('login-error');
const adminDashboardContent = document.getElementById('admin-dashboard-content');
const logoutButton = document.getElementById('logoutButton');

const issueCertificateSection = document.getElementById('issue-certificate');
const issuedCertificatesListContainer = document.getElementById('issued-certificates-list-container');
const certificateVerificationSection = document.getElementById('certificate-verification');
const verifyCertificateForm = document.getElementById('verifyCertificateForm');
const certificateCodeInput = document.getElementById('certificateCodeInput');
const verificationResult = document.getElementById('verification-result');

// Nuevos elementos para el formulario de emisión
const issueCertificateForm = document.getElementById('issueCertificateForm');
const participantNameInput = document.getElementById('participantName');
const courseNameSelect = document.getElementById('courseName');
const issueDateInput = document.getElementById('issueDate'); // <-- Añadido
const issueResult = document.getElementById('issue-result');
const issuedCertificatesList = document.getElementById('issued-certificates-list');

// Elementos del Modal de Certificado
const certificateDetailModal = document.getElementById('certificateDetailModal');
const closeModalButton = certificateDetailModal ? certificateDetailModal.querySelector('.close-button') : null;
const printCertificateButton = certificateDetailModal ? certificateDetailModal.querySelector('.print-certificate-btn') : null;
const qrcodeContainer = document.getElementById('qrcode');


// --- Funciones de Utilidad ---
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
    const courseAbbr = courseAbbrMap[course] || course.substring(0, 2).toUpperCase();
    const count = certificates.filter(c => c.code.startsWith(`SOS-${year}-${courseAbbr}`)).length + 1;
    return `SOS-${year}-${courseAbbr}-${String(count).padStart(3, '0')}`;
}

function showIssueResult(message, type) {
    issueResult.textContent = message;
    issueResult.className = `result-message ${type}`;
    issueResult.style.display = 'block';
    setTimeout(() => {
        issueResult.style.display = 'none';
    }, 5000);
}

function showVerificationResult(message, type) {
    verificationResult.textContent = message;
    verificationResult.className = `result-message ${type}`;
    verificationResult.style.display = 'block';
}

// --- Funciones de Renderizado y Lógica de Certificados ---

function renderIssuedCertificates() {
    issuedCertificatesList.innerHTML = '';
    if (certificates.length === 0) {
        issuedCertificatesList.innerHTML = '<li style="justify-content: center; color: #777;">No hay certificados emitidos aún.</li>';
    } else {
        const sortedCertificates = [...certificates].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedCertificates.forEach((cert) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span><strong>${cert.code}</strong> - ${cert.name} (${cert.course})</span>
                <div>
                    <button class="btn view-btn" data-code="${cert.code}">Ver</button>
                    <button class="btn delete-btn" data-code="${cert.code}">Eliminar</button>
                </div>
            `;
            issuedCertificatesList.appendChild(listItem);
        });

        issuedCertificatesList.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const code = e.target.dataset.code;
                const cert = certificates.find(c => c.code === code);
                if (cert) {
                    showCertificateDetails(cert);
                }
            });
        });

        issuedCertificatesList.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const code = e.target.dataset.code;
                if (confirm(`¿Estás seguro de que quieres eliminar el certificado ${code}?`)) {
                    deleteCertificate(code);
                }
            });
        });
    }
}

function deleteCertificate(code) {
    certificates = certificates.filter(cert => cert.code !== code);
    saveCertificates();
    renderIssuedCertificates();
    showIssueResult('Certificado eliminado exitosamente.', 'success');
}

function showCertificateDetails(cert) {
    console.log("Abriendo detalles del certificado para:", cert.code);
    document.getElementById('detail-code').textContent = cert.code;
    document.getElementById('detail-name').textContent = cert.name;
    document.getElementById('detail-course').textContent = cert.course;
    document.getElementById('detail-date').textContent = cert.date;

    // --- Lógica de Generación del QR ---
    console.log("Intentando generar QR. Contenedor:", qrcodeContainer);
    if (qrcodeContainer) {
        qrcodeContainer.innerHTML = ''; // Limpiar cualquier QR anterior
        
        // Verificar si la librería QRCode está cargada
        if (typeof QRCode !== 'undefined') {
            console.log("QRCode.js está cargado. Procediendo a generar QR...");
            // Asegúrate que la URL de verificación sea accesible públicamente y apunte a tu página
            const verificationURL = `${window.location.origin}${window.location.pathname}?verify=${cert.code}#certificates`;
            console.log("URL de verificación para QR:", verificationURL);
            
            try {
                new QRCode(qrcodeContainer, {
                    text: verificationURL,
                    width: 128,
                    height: 128,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
                console.log("QR Code generado con éxito.");
            } catch (e) {
                console.error("Error al generar el QR Code:", e);
                qrcodeContainer.innerHTML = '<p style="color: red;">Error al generar el código QR. Ver consola para más detalles.</p>';
            }
        } else {
            console.error("Librería QRCode.js no cargada. No se puede generar el QR. Asegúrate que esté antes de certificates.js.");
            qrcodeContainer.innerHTML = '<p style="color: red;">No se pudo cargar la funcionalidad de QR.</p>';
        }
    } else {
        console.error("Contenedor 'qrcode' no encontrado en el DOM. Asegúrate que el ID es correcto en index.html.");
    }
    // --- Fin Lógica de Generación del QR ---

    if (certificateDetailModal) {
        certificateDetailModal.style.display = 'block';
    }
}

function verifyCertificate() {
    const codeToVerify = certificateCodeInput.value.trim();
    if (!codeToVerify) {
        showVerificationResult('Por favor, ingresa un código de certificado.', 'error');
        return;
    }

    const foundCert = certificates.find(cert => cert.code === codeToVerify);

    if (foundCert) {
        showVerificationResult('Certificado encontrado y válido.', 'success');
        showCertificateDetails(foundCert);
    } else {
        showVerificationResult('Certificado no encontrado o inválido. Por favor, verifica el código.', 'error');
    }
}

// --- Funciones de Visibilidad del Panel de Administración ---
function showLoginForm() {
    if (loginForm) loginForm.style.display = 'block';
    if (adminDashboardContent) adminDashboardContent.style.display = 'none';
    
    if (issueCertificateSection) issueCertificateSection.style.display = 'none';
    if (issuedCertificatesListContainer) issuedCertificatesListContainer.style.display = 'none';
    
    if (certificateVerificationSection) certificateVerificationSection.style.display = 'block';

    if (adminPanel) {
        adminPanel.style.backgroundColor = 'var(--color-dark)';
        const h2 = adminPanel.querySelector('h2');
        if (h2) h2.style.color = 'white';
    }
}

function showAdminPanelContent() {
    if (loginForm) loginForm.style.display = 'none';
    if (adminDashboardContent) adminDashboardContent.style.display = 'block';

    if (issueCertificateSection) issueCertificateSection.style.display = 'block';
    if (issuedCertificatesListContainer) issuedCertificatesListContainer.style.display = 'block';
    
    if (certificateVerificationSection) certificateVerificationSection.style.display = 'block';

    if (adminPanel) {
        adminPanel.style.backgroundColor = 'var(--color-light-grey)';
        const h2 = adminPanel.querySelector('h2');
        if (h2) h2.style.color = 'var(--color-dark)';
    }
    renderIssuedCertificates();
}

function logout() {
    loggedIn = false;
    sessionStorage.removeItem('adminLoggedIn');
    showLoginForm();
    if (adminPanel) {
        adminPanel.scrollIntoView({ behavior: 'smooth' });
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Restaurar el estado de login
    const storedLogin = sessionStorage.getItem('adminLoggedIn');
    if (storedLogin === 'true') {
        loggedIn = true;
        showAdminPanelContent();
    } else {
        loggedIn = false;
        showLoginForm();
    }

    renderIssuedCertificates();

    // Lógica para verificar certificado desde la URL (para el QR)
    const urlParams = new URLSearchParams(window.location.search);
    const verifyCode = urlParams.get('verify');
    if (verifyCode) {
        if (certificateCodeInput) certificateCodeInput.value = verifyCode;
        verifyCertificate();
        const certificatesSection = document.getElementById('certificates');
        if (certificatesSection) {
            certificatesSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
});

if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            loggedIn = true;
            sessionStorage.setItem('adminLoggedIn', 'true');
            showAdminPanelContent();
            if (loginError) loginError.style.display = 'none';
            if (adminPanel) {
                adminPanel.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            if (loginError) loginError.style.display = 'block';
        }
    });
}

if (issueCertificateForm) {
    issueCertificateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = participantNameInput.value.trim();
        const course = courseNameSelect.value;
        const issueDate = issueDateInput.value; // <-- Captura el valor de la fecha

        // Validar también la fecha
        if (!name || !course || !issueDate) {
            showIssueResult('Por favor, completa todos los campos (nombre, curso, y fecha).', 'error');
            return;
        }

        // Formatear la fecha para que se guarde en formato legible (DD/MM/YYYY)
        const dateObj = new Date(issueDate + 'T00:00:00'); // Añade T00:00:00 para evitar problemas de zona horaria
        const formattedDate = dateObj.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' });

        const newCode = generateUniqueCode(course);
        const newCertificate = {
            code: newCode,
            name: name,
            course: course,
            date: formattedDate // <-- Usa la fecha capturada y formateada
        };

        certificates.push(newCertificate);
        saveCertificates();
        renderIssuedCertificates();
        showIssueResult(`Certificado para ${name} emitido con código: ${newCode}`, 'success');

        participantNameInput.value = '';
        courseNameSelect.value = '';
        issueDateInput.value = ''; // Limpiar también el campo de fecha
    });
}

if (verifyCertificateForm) {
    verifyCertificateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        verifyCertificate();
    });
}

if (closeModalButton) {
    closeModalButton.addEventListener('click', () => {
        if (certificateDetailModal) certificateDetailModal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (certificateDetailModal && event.target === certificateDetailModal) {
        certificateDetailModal.style.display = 'none';
    }
});

if (printCertificateButton) {
    printCertificateButton.addEventListener('click', () => {
        const printContent = document.getElementById('certificate-details-content').innerHTML;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Certificado SOS ALERTA PERÚ</title>');
        printWindow.document.write('<link rel="stylesheet" href="css/style.css">');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { font-family: 'Open Sans', sans-serif; margin: 40px; text-align: center; }
            h3 { color: #FF4500; font-family: 'Montserrat', sans-serif; margin-bottom: 20px; }
            p { margin-bottom: 10px; font-size: 1.1em; }
            p strong { color: #007BFF; }
            .qr-code-container { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
            #qrcode { display: block; margin: 20px auto; width: 128px; height: 128px; }
            .qr-info { font-size: 0.9em; color: #666; margin-top: 10px; }
            @media print {
                .qr-code-container { border: none; }
                .print-certificate-btn { display: none; }
            }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write('<div style="border: 2px solid #FF4500; padding: 40px; border-radius: 15px; max-width: 700px; margin: auto;">');
        printWindow.document.write('<img src="img/logo.png" style="width: 150px; margin-bottom: 20px;">');
        printWindow.document.write('<h2>Certificado de Participación</h2>');
        printWindow.document.write(printContent);
        printWindow.document.write('<p style="margin-top: 30px; font-style: italic;">Certificado emitido por SOS ALERTA PERÚ.</p>');
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    });
}


document.querySelector('a[href="#admin-panel"]').addEventListener('click', (e) => {
    e.preventDefault();
    if (loggedIn) {
        showAdminPanelContent();
    } else {
        showLoginForm();
    }
    if (adminPanel) {
        adminPanel.scrollIntoView({ behavior: 'smooth' });
    }
});

if (logoutButton) {
    logoutButton.addEventListener('click', logout);
}