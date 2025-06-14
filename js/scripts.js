
function verificarCertificado() {
    const codigo = document.getElementById("codigo-cert").value;
    const resultado = document.getElementById("resultado-verificacion");
    const certificados = {
        "SOS-2023-PA-001": { nombre: "Juan Pérez", curso: "Primeros Auxilios", fecha: "2023-08-15" }
    };

    if (certificados[codigo]) {
        const c = certificados[codigo];
        resultado.innerHTML = `<p>Certificado válido:</p><p>Nombre: ${c.nombre}</p><p>Curso: ${c.curso}</p><p>Fecha: ${c.fecha}</p>`;
    } else {
        resultado.innerHTML = "<p style='color:red;'>Certificado no encontrado</p>";
    }
}
