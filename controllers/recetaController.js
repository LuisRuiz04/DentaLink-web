import PDFDocument from 'pdfkit';
import Receta from '../models/recetaModel.js';
import Paciente from '../models/pacienteModel.js';

export const vistaReceta = async (req, res) => {
    try {
        // En la vista previa solo cargamos los pacientes del consultorio actual
        const pacientes = await Paciente.findAll({ where: { clinicaId: req.clinicaActiva.id } });
        res.render('receta', { pacientes, pagina: 'recetas' });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
};

export const generarReceta = async (req, res) => {
    const { pacienteId, medicamentos } = req.body;
    
    try {
        const paciente = await Paciente.findByPk(pacienteId);
        if (!paciente) return res.status(404).json({ success: false, msg: 'Paciente no encontrado' });

        const folio = `RX-${Date.now().toString().slice(-5)}`;
        
        const nuevaReceta = await Receta.create({
            folio, 
            medicamentos, 
            clinicaId: req.clinicaActiva.id,
            pacienteId: paciente.id
        });

        // Devolvemos el ID de la receta generada en la base de datos
        res.json({ success: true, id: nuevaReceta.id });

    } catch (error) {
        console.log("Error al guardar receta en BD:", error);
        res.status(500).json({ success: false, msg: 'Error interno' });
    }
};

export const descargarReceta = async (req, res) => {
    const { id } = req.params;

    try {
        const receta = await Receta.findOne({ where: { id, clinicaId: req.clinicaActiva.id } });
        if (!receta) return res.status(404).send('Receta no encontrada');

        const paciente = await Paciente.findByPk(receta.pacienteId);
        
        const doctorInfo = req.doctor; 
        const clinicaInfo = req.clinicaActiva; 

        const nombreArchivo = `${receta.folio}_${paciente.nombre.replace(/\s+/g, '_')}.pdf`;

        // Configurar headers para forzar la descarga del PDF en el navegador
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Conectar el stream del PDF directamente a la respuesta HTTP (sin pasarlo por el disco duro)
        doc.pipe(res);

        const colorCyan = '#00A5C4';
        const colorOscuro = '#1e293b';
        const colorGris = '#64748b';
        const colorGrisClaro = '#e2e8f0';

        // --- VARIABLES DINÁMICAS MULTI-TENANT ---
        const nombreClinica = clinicaInfo.nombre_clinica || 'Clínica Dental';
        const dir = clinicaInfo.direccion || 'Dirección no registrada';
        const tel = clinicaInfo.telefono || 'Sin teléfono';
        const nombreDoctor = doctorInfo.nombre_doctor || 'Doctor';
        const numCedula = doctorInfo.cedula || 'En trámite';

        // 1. CABECERA
        doc.roundedRect(50, 50, 30, 30, 6).fill(colorCyan);
        doc.font('Helvetica-Bold').fillColor(colorCyan).fontSize(22).text(nombreClinica, 95, 50);
        doc.font('Helvetica').fillColor(colorGris).fontSize(10).text('Odontología integral', 95, 75);

        // 2. LÍNEA SEPARADORA
        doc.moveTo(50, 110).lineTo(545, 110).lineWidth(1).stroke(colorGrisClaro);

        // 3. METADATOS
        const fechaActual = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.fillColor(colorGris).fontSize(10).text(fechaActual, 50, 130);
        doc.fillColor(colorCyan).fontSize(10).text(`Folio ${receta.folio}`, 400, 130, { align: 'right', width: 145 });

        // 4. DATOS PACIENTE
        const nombreCompletoP = `${paciente.nombre} ${paciente.apellidos || ''}`.trim();
        doc.font('Helvetica-Bold').fillColor(colorOscuro).fontSize(13).text(`Paciente: ${nombreCompletoP}`, 50, 160);
        doc.font('Helvetica').fillColor(colorGris).fontSize(10).text(`Expediente: DL-${String(paciente.id).padStart(5, '0')}`, 50, 178);

        // 5. SÍMBOLO Rx
        doc.font('Helvetica-Bold').fillColor(colorCyan).fontSize(30).text('Rx', 50, 220);

        // 6. MEDICAMENTOS (Obtenidos directo de la base de datos)
        let currentY = 280;
        receta.medicamentos.forEach((med, index) => {
            if (currentY > 600) {
                doc.addPage();
                currentY = 50;
            }
            doc.font('Helvetica-Bold').fillColor(colorOscuro).fontSize(12).text(`${index + 1}. ${med.nombre} ${med.dosis}`, 50, currentY);
            doc.font('Helvetica').fillColor(colorGris).fontSize(10).text(med.frecuencia, 50, currentY + 16, { width: 480, lineGap: 2 });
            currentY += 45; 
        });

        // 7. FOOTER DINÁMICO
        const footerY = 720;
        doc.moveTo(180, footerY - 20).lineTo(415, footerY - 20).lineWidth(1).stroke(colorOscuro);
        
        doc.font('Helvetica-Bold').fillColor(colorOscuro).fontSize(12).text(`Dr. ${nombreDoctor}`, 180, footerY - 10, { align: 'center', width: 235 });
        doc.font('Helvetica').fillColor(colorGris).fontSize(9).text(`Odontólogo · Cédula profesional ${numCedula}`, 180, footerY + 6, { align: 'center', width: 235 });
        doc.fillColor(colorGris).fontSize(8).text(`${dir} · Tel. ${tel} | Esta receta es de uso exclusivo para el paciente indicado.`, 50, footerY + 35, { align: 'center', width: 495 });

        // Esto cierra el archivo y envía la descarga
        doc.end();

    } catch (error) {
        console.log("Error al generar PDF:", error);
        res.status(500).send('Error interno al generar el PDF');
    }
};