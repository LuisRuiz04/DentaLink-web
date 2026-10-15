import express from 'express';
import { registrarDoctor, autenticarDoctor } from '../controllers/doctorController.js';

const route = express.Router();

// Ruta para la pantalla de Login y Sign Up unificada
route.get('/auth', (req, res) => {
    // Capturamos el parámetro 'error' de la URL (si existe)
    const error = req.query.error; 
    // Se lo pasamos a la vista Pug
    res.render('auth', { error }); 
});

// Ruta para procesar el Registro
route.post('/registro', registrarDoctor);

// NUEVA RUTA: Procesar el Inicio de Sesión
route.post('/login', autenticarDoctor);

// Ruta para ver el Dashboard de Citas (después de iniciar sesión)
route.get('/', (req, res) => {
    res.render('dashboard');
});

// Ruta para ver el Expediente Clínico
route.get('/expediente', (req, res) => {
    res.render('expediente');
});

// Ruta para ver el Odontograma
route.get('/odontograma', (req, res) => {
    res.render('odontograma');
});

// Ruta para ver el Historial Fotográfico
route.get('/historial', (req, res) => {
    res.render('historial-fotos');
});

// Ruta para ver el Recetario Médico
route.get('/receta', (req, res) => {
    res.render('receta');
});

// Ruta para ver el Control de Inventario
route.get('/inventario', (req, res) => {
    res.render('inventario');
});

export default route;