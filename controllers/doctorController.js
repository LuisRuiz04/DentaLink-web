import Doctor from '../models/doctorModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Función 1: Registrar Doctor
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
        res.redirect('/auth'); 

    } catch (error) {
        console.log("Error al registrar al doctor: ", error);
    }
};

// Función 2: Iniciar Sesión
const autenticarDoctor = async (req, res) => {
    const { email, password } = req.body;

    try {
        const doctor = await Doctor.findOne({ where: { email } });
        if (!doctor) {
            console.log("El usuario no existe");
            return res.redirect('/auth?error=1');
        }

        const passwordCorrecto = await bcrypt.compare(password, doctor.password);
        if (!passwordCorrecto) {
            console.log("Contraseña incorrecta");
            return res.redirect('/auth?error=1');
        }

        const token = jwt.sign(
            { id: doctor.id, nombre: doctor.nombre_doctor },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } 
        );

        console.log("¡Inicio de sesión exitoso!");
        return res.cookie('_token', token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production'
        }).redirect('/'); 

    } catch (error) {
        console.log("Error al iniciar sesión: ", error);
        return res.redirect('/auth?error=2'); 
    }
};

// Función 3: Cerrar Sesión (¡NUEVA!)
const cerrarSesion = (req, res) => {
    // Destruimos la cookie y mandamos al login
    return res.clearCookie('_token').redirect('/auth');
};

export { registrarDoctor, autenticarDoctor, cerrarSesion };