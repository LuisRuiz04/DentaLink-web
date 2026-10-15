import express from 'express';
import { registrarDoctor, autenticarDoctor, cerrarSesion } from '../controllers/doctorController.js'; // Importamos cerrarSesion
import { registrarPaciente } from '../controllers/pacienteController.js'; 
import protegerRuta from '../middleware/authMiddleware.js'; 
import Paciente from '../models/pacienteModel.js';

const route = express.Router();

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

route.get('/auth', (req, res) => {
    const error = req.query.error; 
    res.render('auth', { error }); 
});

route.post('/registro', registrarDoctor);
route.post('/login', autenticarDoctor);

// NUEVA RUTA: Cerrar sesión
route.get('/cerrar-sesion', cerrarSesion);

// ==========================================
// RUTAS PRIVADAS (Protegidas)
// ==========================================

route.get('/', protegerRuta, (req, res) => {
    res.render('dashboard', { doctor: req.doctor });
});

// Ruta para ver el Expediente Clínico (Directorio de Pacientes)
route.get('/expediente', protegerRuta, async (req, res) => {
    try {
        // Buscamos TODOS los pacientes que pertenezcan al doctor que inició sesión
        const pacientes = await Paciente.findAll({
            where: { doctorId: req.doctor.id }
        });
        
        // Le mandamos a la vista los pacientes reales
        res.render('expediente', { pacientes }); 
    } catch (error) {
        console.log(error);
        res.render('expediente', { pacientes: [] });
    }
});

route.post('/pacientes/nuevo', protegerRuta, registrarPaciente);

route.get('/odontograma', protegerRuta, (req, res) => {
    res.render('odontograma');
});

route.get('/historial', protegerRuta, (req, res) => {
    res.render('historial-fotos');
});

route.get('/receta', protegerRuta, (req, res) => {
    res.render('receta');
});

route.get('/inventario', protegerRuta, (req, res) => {
    res.render('inventario');
});

export default route;