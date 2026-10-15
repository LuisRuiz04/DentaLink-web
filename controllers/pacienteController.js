import Paciente from '../models/pacienteModel.js';
import bcrypt from 'bcrypt';

const registrarPaciente = async (req, res) => {
    // 1. Extraemos los datos que llenó el doctor en el formulario
    const { nombre, apellidos, telefono, direccion, correo, password } = req.body;
    
    // 2. Extraemos el ID del doctor gracias al gafete (token) de tu middleware
    const doctorId = req.doctor.id; 

    try {
        // 3. Revisar que el correo no esté registrado ya en la app
        const existePaciente = await Paciente.findOne({ where: { correo } });
        if (existePaciente) {
            console.log("El paciente ya está registrado.");
            return res.redirect('/expediente?error=1');
        }

        // 4. Encriptamos la contraseña para que su futura app sea segura
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Guardamos en la base de datos vinculando al paciente con SU doctor
        await Paciente.create({
            nombre,
            apellidos,
            telefono,
            direccion,
            correo,
            password: hashedPassword,
            doctorId // ¡Aquí se hace la magia de la vinculación!
        });

        console.log("¡Paciente registrado y vinculado con éxito!");
        res.redirect('/expediente'); // Recargamos la tabla

    } catch (error) {
        console.log("Error al registrar paciente: ", error);
        res.redirect('/expediente?error=2');
    }
};

export { registrarPaciente };