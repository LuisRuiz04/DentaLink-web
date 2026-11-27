// Solo LECTURA: reúne en una sola pantalla lo que el doctor necesita durante la consulta.
// No crea ni modifica nada; guardar sigue pasando por los controladores de siempre.
import Cita from '../models/citaModel.js';
import Paciente from '../models/pacienteModel.js';
import Odontograma from '../models/odontogramaModel.js';
import ExpedienteNota from '../models/expedienteModel.js';
import { Op } from 'sequelize';

const hoyISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

// GET /api/pacientes  -> lista corta para el asistente de "Nueva cita"
const listarPacientes = async (req, res) => {
    const clinicaId = req.clinicaActiva ? req.clinicaActiva.id : null;
    if (!clinicaId) return res.json([]);
    try {
        const pacientes = await Paciente.findAll({
            where: { clinicaId },
            attributes: ['id', 'nombre', 'apellidos', 'telefono'],
            order: [['nombre', 'ASC']]
        });
        res.json(pacientes);
    } catch (error) {
        console.error('Error al listar pacientes:', error);
        res.status(500).json([]);
    }
};

// GET /consulta?cita=ID  -> pantalla de consulta de una cita
const verConsulta = async (req, res) => {
    const { cita: citaId } = req.query;
    const clinicaId = req.clinicaActiva ? req.clinicaActiva.id : null;
    if (!citaId || !clinicaId) return res.redirect('/');

    try {
        const cita = await Cita.findOne({ where: { id: citaId, clinicaId } });
        if (!cita) return res.redirect('/');

        const paciente = await Paciente.findOne({ where: { id: cita.pacienteId, clinicaId } });
        if (!paciente) return res.redirect('/');

        const [notas, odontograma, proximas, anteriores] = await Promise.all([
            ExpedienteNota.findAll({ where: { pacienteId: paciente.id, clinicaId }, order: [['createdAt', 'DESC']], limit: 5 }),
            Odontograma.findOne({ where: { pacienteId: paciente.id, clinicaId } }),
            Cita.findAll({
                where: { pacienteId: paciente.id, clinicaId, estado: 'Pendiente', id: { [Op.ne]: cita.id }, fecha: { [Op.gte]: hoyISO() } },
                order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']], limit: 4
            }),
            Cita.findAll({
                where: { pacienteId: paciente.id, clinicaId, estado: 'Completada', id: { [Op.ne]: cita.id } },
                order: [['fecha', 'DESC'], ['hora_inicio', 'DESC']], limit: 3
            })
        ]);

        res.render('consulta', {
            pagina: 'agenda',
            cita,
            paciente,
            notas,
            hallazgos: odontograma && odontograma.hallazgos && typeof odontograma.hallazgos === 'object' ? odontograma.hallazgos : {},
            proximas,
            anteriores
        });
    } catch (error) {
        console.error('Error al abrir la consulta:', error);
        res.redirect('/');
    }
};

export { verConsulta, listarPacientes };
