// Chat clínica <-> paciente (lado web).
// Todo se limita a la CLÍNICA ACTIVA: un consultorio nunca ve ni escribe conversaciones de otro.
import { Op, fn, col } from 'sequelize';
import Mensaje from '../models/mensajeModel.js';
import Paciente from '../models/pacienteModel.js';

const MAX_TEXTO = 2000;
const campos = ['id', 'remitente', 'texto', 'leido', 'createdAt'];
const clinicaDe = (req) => (req.clinicaActiva ? req.clinicaActiva.id : null);

// GET /mensajes  -> la vista (bandeja + chat)
const vistaMensajes = (req, res) => {
    res.render('mensajes', { pagina: 'mensajes' });
};

// GET /api/mensajes/pendientes  -> para la bolita roja del menú (se consulta cada 10 s)
// total: mensajes sin leer de la clínica activa; clinicas: sin leer por cada clínica del doctor
const pendientes = async (req, res) => {
    try {
        const ids = (res.locals.misClinicas || []).map((c) => c.id);
        if (!ids.length) return res.json({ total: 0, chats: 0, clinicas: {} });

        const filas = await Mensaje.findAll({
            where: { clinicaId: { [Op.in]: ids }, remitente: 'paciente', leido: false },
            attributes: ['clinicaId', 'pacienteId', [fn('COUNT', col('id')), 'n']],
            group: ['clinicaId', 'pacienteId'],
            raw: true
        });

        const activa = clinicaDe(req);
        const clinicas = {};
        let total = 0;
        let chats = 0;
        filas.forEach((f) => {
            const n = Number(f.n) || 0;
            clinicas[f.clinicaId] = (clinicas[f.clinicaId] || 0) + n;
            if (f.clinicaId === activa) { total += n; chats += 1; }
        });
        res.json({ total, chats, clinicas });
    } catch (error) {
        console.error('Error al contar mensajes pendientes:', error);
        res.status(500).json({ total: 0, chats: 0, clinicas: {} });
    }
};

// GET /api/mensajes/conversaciones  -> todos los pacientes de la clínica con su último mensaje
const conversaciones = async (req, res) => {
    const clinicaId = clinicaDe(req);
    if (!clinicaId) return res.json([]);
    try {
        const [pacientes, ultimos, noLeidos] = await Promise.all([
            Paciente.findAll({ where: { clinicaId }, attributes: ['id', 'nombre', 'apellidos', 'telefono'], raw: true }),
            Mensaje.findAll({
                where: { clinicaId },
                attributes: ['pacienteId', [fn('MAX', col('id')), 'ultimoId']],
                group: ['pacienteId'],
                raw: true
            }),
            Mensaje.findAll({
                where: { clinicaId, remitente: 'paciente', leido: false },
                attributes: ['pacienteId', [fn('COUNT', col('id')), 'n']],
                group: ['pacienteId'],
                raw: true
            })
        ]);

        const idsUltimos = ultimos.map((u) => u.ultimoId).filter(Boolean);
        const mensajes = idsUltimos.length
            ? await Mensaje.findAll({ where: { id: { [Op.in]: idsUltimos } }, attributes: [...campos, 'pacienteId'], raw: true })
            : [];

        const ultimoPor = new Map(mensajes.map((m) => [m.pacienteId, m]));
        const sinLeerPor = new Map(noLeidos.map((n) => [n.pacienteId, Number(n.n) || 0]));

        res.json(pacientes.map((p) => {
            const u = ultimoPor.get(p.id);
            return {
                id: p.id,
                nombre: p.nombre,
                apellidos: p.apellidos,
                telefono: p.telefono,
                noLeidos: sinLeerPor.get(p.id) || 0,
                ultimo: u ? { id: u.id, remitente: u.remitente, texto: u.texto, leido: u.leido, createdAt: u.createdAt } : null
            };
        }));
    } catch (error) {
        console.error('Error al listar conversaciones:', error);
        res.status(500).json([]);
    }
};

// GET /api/mensajes/chat/:pacienteId?despues=ID
// Sin "despues": todo el historial. Con "despues": solo lo nuevo (se consulta cada 3 s con el chat abierto).
// Al consultar, los mensajes del paciente quedan como leídos (la clínica ya los vio).
const historial = async (req, res) => {
    const clinicaId = clinicaDe(req);
    const pacienteId = parseInt(req.params.pacienteId, 10);
    const despues = parseInt(req.query.despues, 10) || 0;
    try {
        const paciente = clinicaId && pacienteId
            ? await Paciente.findOne({ where: { id: pacienteId, clinicaId }, attributes: ['id', 'nombre', 'apellidos', 'telefono', 'correo'], raw: true })
            : null;
        if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado en esta clínica' });

        const where = { clinicaId, pacienteId };
        if (despues) where.id = { [Op.gt]: despues };

        const [mensajes] = await Promise.all([
            Mensaje.findAll({ where, attributes: campos, order: [['id', 'ASC']], raw: true }),
            Mensaje.update({ leido: true }, { where: { clinicaId, pacienteId, remitente: 'paciente', leido: false } })
        ]);
        // Hasta qué mensaje de la clínica ya leyó el paciente (para las palomitas azules)
        const leidoHasta = (await Mensaje.max('id', { where: { clinicaId, pacienteId, remitente: 'clinica', leido: true } })) || 0;

        res.json({ paciente, mensajes, leidoHasta });
    } catch (error) {
        console.error('Error al cargar el chat:', error);
        res.status(500).json({ error: 'No se pudo cargar el chat' });
    }
};

// POST /api/mensajes/chat/:pacienteId   { texto }
const enviar = async (req, res) => {
    const clinicaId = clinicaDe(req);
    const pacienteId = parseInt(req.params.pacienteId, 10);
    const texto = typeof req.body.texto === 'string' ? req.body.texto.trim() : '';

    if (!texto) return res.status(400).json({ error: 'El mensaje está vacío' });
    if (texto.length > MAX_TEXTO) return res.status(400).json({ error: `El mensaje no puede pasar de ${MAX_TEXTO} caracteres` });

    try {
        const paciente = clinicaId && pacienteId ? await Paciente.findOne({ where: { id: pacienteId, clinicaId }, attributes: ['id'] }) : null;
        if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado en esta clínica' });

        const m = await Mensaje.create({ clinicaId, pacienteId, remitente: 'clinica', texto });
        res.status(201).json({ mensaje: { id: m.id, remitente: m.remitente, texto: m.texto, leido: m.leido, createdAt: m.createdAt } });
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'No se pudo enviar el mensaje' });
    }
};

export { vistaMensajes, pendientes, conversaciones, historial, enviar, MAX_TEXTO };
