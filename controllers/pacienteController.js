import Paciente from '../models/pacienteModel.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

const registrarPaciente = async (req, res) => {
    // 1. Extraemos los datos que llenó el doctor en el formulario
    const { nombre, apellidos, telefono, direccion, correo, password } = req.body;

    try {
        // 2. Revisar que el correo no esté registrado ya en la app
        const existePaciente = await Paciente.findOne({ where: { correo } });
        if (existePaciente) {
            console.log("El paciente ya está registrado.");
            return res.redirect('/expediente?error=1');
        }

        // 3. Encriptamos la contraseña para que su futura app sea segura
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Guardamos en la base de datos vinculando al paciente con SU clínica activa
        await Paciente.create({
            nombre,
            apellidos,
            telefono,
            direccion,
            correo,
            password: hashedPassword,
            clinicaId: req.clinicaActiva.id // ¡Aquí se hace la magia de la vinculación!
        });

        console.log("¡Paciente registrado y vinculado con éxito!");
        res.redirect('/expediente'); // Recargamos la tabla

    } catch (error) {
        console.log("Error al registrar paciente: ", error);
        res.redirect('/expediente?error=2');
    }
};

// Editar los datos de un paciente de la clínica activa.
// La contraseña solo cambia si el doctor escribe una nueva (mismo cifrado bcrypt que al registrar,
// para que el paciente pueda seguir entrando a la app móvil).
const editarPaciente = async (req, res) => {
    const { id } = req.params;
    const clinicaId = req.clinicaActiva ? req.clinicaActiva.id : null;
    const limpio = (v) => (typeof v === 'string' ? v.trim() : '');
    const nombre = limpio(req.body.nombre);
    const apellidos = limpio(req.body.apellidos);
    const telefono = limpio(req.body.telefono);
    const direccion = limpio(req.body.direccion);
    const correo = limpio(req.body.correo);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    // Regresar a la misma pantalla desde donde se editó
    const destino = req.body.volver === 'detalle'
        ? `/expediente/detalle?paciente=${encodeURIComponent(id)}`
        : '/expediente';
    const conError = (codigo) => destino + (destino.includes('?') ? '&' : '?') + 'error=' + codigo;

    try {
        if (!clinicaId) return res.redirect('/expediente?error=3');

        // Solo se puede editar un paciente de la clínica activa
        const paciente = await Paciente.findOne({ where: { id, clinicaId } });
        if (!paciente) return res.redirect('/expediente?error=3');

        if (!nombre || !apellidos || !telefono || !direccion || !correo) return res.redirect(conError(2));
        if (password && password.length < 6) return res.redirect(conError(4));

        // El correo es el usuario de la app móvil: no puede repetirse
        if (correo !== paciente.correo) {
            const otro = await Paciente.findOne({ where: { correo, id: { [Op.ne]: paciente.id } } });
            if (otro) return res.redirect(conError(1));
        }

        paciente.nombre = nombre;
        paciente.apellidos = apellidos;
        paciente.telefono = telefono;
        paciente.direccion = direccion;
        paciente.correo = correo;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            paciente.password = await bcrypt.hash(password, salt);
        }

        await paciente.save();
        console.log(`Paciente ${paciente.id} actualizado.`);
        res.redirect(destino);
    } catch (error) {
        console.log('Error al editar paciente: ', error);
        res.redirect(conError(2));
    }
};

export { registrarPaciente, editarPaciente };