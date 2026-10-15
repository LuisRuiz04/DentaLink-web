import Doctor from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Función 1: Registrar Doctor (la que ya tenías)
const registrarDoctor = async (req, res) => {
    const { nombre_doctor, nombre_clinica, email, password } = req.body;

    try {
        const existeDoctor = await Doctor.findOne({ where: { email } });
        
        if (existeDoctor) {
            console.log("El correo ya está registrado");
            return res.render('auth'); 
        }

        await Doctor.create({
            nombre_doctor,
            nombre_clinica,
            email,
            password
        });

        console.log("¡Doctor registrado con éxito!");
        res.redirect('/auth'); // Redirigimos de vuelta al login tras registrarse

    } catch (error) {
        console.log("Error al registrar al doctor: ", error);
    }
};

// Función 2: Iniciar Sesión (¡NUEVA!)
// Función 2: Iniciar Sesión
const autenticarDoctor = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Verificar si el doctor existe
        const doctor = await Doctor.findOne({ where: { email } });
        if (!doctor) {
            console.log("El usuario no existe");
            // Redirigimos con un mensaje de error en la URL
            return res.redirect('/auth?error=1');
        }

        // 2. Comprobar su contraseña
        const passwordCorrecto = await bcrypt.compare(password, doctor.password);
        if (!passwordCorrecto) {
            console.log("Contraseña incorrecta");
            // Redirigimos con un mensaje de error en la URL
            return res.redirect('/auth?error=1');
        }

        // 3. Generar el Token (Gafete virtual)
        const token = jwt.sign(
            { id: doctor.id, nombre: doctor.nombre_doctor },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // El token dura 1 día
        );

        // 4. Guardar el token en una cookie y enviarlo al Dashboard
        console.log("¡Inicio de sesión exitoso!");
        return res.cookie('_token', token, {
            httpOnly: true, // Mayor seguridad
            secure: process.env.NODE_ENV === 'production'
        }).redirect('/'); // Lo mandamos al dashboard

    } catch (error) {
        console.log("Error al iniciar sesión: ", error);
        return res.redirect('/auth?error=2'); // Error general
    }
};

export { registrarDoctor, autenticarDoctor };