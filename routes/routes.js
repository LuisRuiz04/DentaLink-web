import express from 'express';
import { Op } from 'sequelize'; 
import { registrarDoctor, autenticarDoctor, cerrarSesion, editarPerfil } from '../controllers/doctorController.js'; 
import { registrarPaciente } from '../controllers/pacienteController.js'; 
import { agregarProducto, actualizarProducto, ajustarStock, eliminarProducto } from '../controllers/inventarioController.js'; 

// Importación actualizada para recetas
import { vistaReceta, generarReceta, descargarReceta } from '../controllers/recetaController.js'; 

import { agregarClinica, cambiarClinica, editarClinica, eliminarClinica } from '../controllers/clinicaController.js'; 

import protegerRuta from '../middleware/authMiddleware.js'; 
import Paciente from '../models/pacienteModel.js';
import Inventario from '../models/inventarioModel.js';

const route = express.Router();

route.get('/auth', (req, res) => {
    const error = req.query.error; 
    res.render('auth', { error }); 
});

route.post('/registro', registrarDoctor);
route.post('/login', autenticarDoctor);
route.get('/cerrar-sesion', cerrarSesion);

// --- RUTAS MULTI-CLÍNICA ---
route.post('/clinica/nueva', protegerRuta, agregarClinica);
route.get('/cambiar-clinica/:id', protegerRuta, cambiarClinica);
route.post('/clinica/editar/:id', protegerRuta, editarClinica);
route.post('/clinica/eliminar/:id', protegerRuta, eliminarClinica);

// --- RUTA DEL PERFIL ---
route.post('/perfil/editar', protegerRuta, editarPerfil);

route.get('/', protegerRuta, (req, res) => {
    // res.locals ya inyecta doctor y clinicaActiva automáticamente gracias al middleware
    res.render('dashboard', { pagina: 'agenda' });
});

route.get('/expediente', protegerRuta, async (req, res) => {
    try {
        const clinicaId = req.clinicaActiva ? req.clinicaActiva.id : null;
        const pacientes = clinicaId ? await Paciente.findAll({ where: { clinicaId } }) : [];
        
        res.render('expediente', { pacientes, pagina: 'pacientes' }); 
    } catch (error) {
        console.log(error);
        res.render('expediente', { pacientes: [], pagina: 'pacientes' });
    }
});

route.post('/pacientes/nuevo', protegerRuta, registrarPaciente);

route.get('/odontograma', protegerRuta, (req, res) => {
    res.render('odontograma', { pagina: 'odontograma' });
});

route.get('/historial', protegerRuta, (req, res) => {
    res.render('historial-fotos', { pagina: 'historial' });
});

// --- RUTAS DE RECETAS ---
route.get('/receta', protegerRuta, vistaReceta); 
route.post('/receta/generar', protegerRuta, generarReceta); 
route.get('/receta/descargar/:id', protegerRuta, descargarReceta); // ¡NUEVA RUTA!

route.get('/inventario', protegerRuta, async (req, res) => {
    const { q } = req.query; 
    try {
        const clinicaId = req.clinicaActiva ? req.clinicaActiva.id : null;
        let condicion = clinicaId ? { clinicaId } : { clinicaId: null }; 
        
        if (q) {
            condicion.nombre = { [Op.iLike]: `%${q}%` }; 
        }
        
        const productos = clinicaId ? await Inventario.findAll({
            where: condicion,
            order: [['id', 'DESC']]
        }) : [];
        
        const categoriasUnicas = [...new Set(productos.map(p => p.categoria).filter(c => c))];
        res.render('inventario', { pagina: 'inventario', productos, busqueda: q, categoriasUnicas });
    } catch (error) {
        console.log(error);
        res.render('inventario', { pagina: 'inventario', productos: [], busqueda: q, categoriasUnicas: [] });
    }
});

route.post('/inventario/nuevo', protegerRuta, agregarProducto);
route.post('/inventario/editar/:id', protegerRuta, actualizarProducto);
route.post('/inventario/ajustar-stock/:id', protegerRuta, ajustarStock);
route.post('/inventario/eliminar/:id', protegerRuta, eliminarProducto);

export default route;