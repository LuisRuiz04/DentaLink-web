import Paciente from '../models/pacienteModel.js';
import ExpedienteNota from '../models/expedienteModel.js';

const verExpedienteDetalle = async (req, res) => {
    const { paciente: pacienteId } = req.query;
    const clinicaId = req.clinicaActiva ? req.clinicaActiva.id : null;

    if (!pacienteId || !clinicaId) {
        return res.redirect('/expediente');
    }

    try {
        const paciente = await Paciente.findOne({
            where: { id: pacienteId, clinicaId }
        });

        if (!paciente) {
            return res.redirect('/expediente');
        }

        // Obtener todas las notas del paciente ordenadas de la más reciente a la más antigua
        const notas = await ExpedienteNota.findAll({
            where: { pacienteId, clinicaId },
            order: [['createdAt', 'DESC']]
        });

        res.render('expediente-detalle', {
            pagina: 'expediente',
            paciente,
            notas
        });

    } catch (error) {
        console.log(error);
        res.redirect('/expediente');
    }
};

const agregarNotaExpediente = async (req, res) => {
    const { pacienteId, nota } = req.body;
    const clinicaId = req.clinicaActiva ? req.clinicaActiva.id : null;

    if (!pacienteId || !nota || !clinicaId) {
        return res.redirect('/expediente');
    }

    try {
        await ExpedienteNota.create({
            pacienteId,
            clinicaId,
            nota
        });

        res.redirect(`/expediente/detalle?paciente=${pacienteId}`);
    } catch (error) {
        console.log(error);
        res.redirect('/expediente');
    }
};

export {
    verExpedienteDetalle,
    agregarNotaExpediente
};