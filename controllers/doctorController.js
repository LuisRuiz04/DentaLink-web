import Doctor from '../models/doctorModel.js';
import Clinica from '../models/clinicaModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Función 1: Registrar Doctor y su Primera Clínica
const registrarDoctor = async (req, res) => {
    // Extraemos todos los campos del formulario
    const { nombre_doctor, nombre_clinica, email, password, telefono, cedula, direccion } = req.body;

    try {
        const existeDoctor = await Doctor.findOne({ where: { email } });
        
        if (existeDoctor) {
            console.log("El correo ya está registrado");
            return res.redirect('/auth'); 
        }

        // 1. CREAMOS AL DOCTOR (Solo sus datos personales y profesionales)
        const nuevoDoctor = await Doctor.create({
            nombre_doctor,
            email,
            password,
            cedula
        });

        // 2. CREAMOS SU PRIMERA CLÍNICA AUTOMÁTICAMENTE
        await Clinica.create({
            nombre_clinica,
            telefono,
            direccion,
            doctorId: nuevoDoctor.id // Lo vinculamos al doctor recién creado
        });

        console.log("¡Doctor y Clínica registrados con éxito!");
        res.redirect('/auth'); 

    } catch (error) {
        console.log("Error al registrar al doctor y clínica: ", error);
        res.redirect('/auth');
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

// Función 3: Cerrar Sesión
const cerrarSesion = (req, res) => {
    // Borramos tanto la sesión del doctor como la memoria de la clínica que tenía abierta
    return res.clearCookie('_token').clearCookie('_clinicaActivaId').redirect('/auth');
};

// Función 4: Editar Datos Personales del Doctor
const editarPerfil = async (req, res) => {
    const { nombre_doctor, cedula, email, password } = req.body;
    
    try {
        const doctor = await Doctor.findByPk(req.doctor.id);
        
        if (doctor) {
            doctor.nombre_doctor = nombre_doctor;
            doctor.cedula = cedula;
            doctor.email = email;
            
            // Solo actualizamos la contraseña si el usuario escribió una nueva
            if (password && password.trim() !== '') {
                const salt = await bcrypt.genSalt(10);
                doctor.password = await bcrypt.hash(password, salt);
            }
            
            await doctor.save();
        }
        
        res.redirect(req.get('referer') || '/');
    } catch (error) {
        console.log("Error al actualizar el perfil:", error);
        res.redirect('/');
    }
};

export { registrarDoctor, autenticarDoctor, cerrarSesion, editarPerfil };