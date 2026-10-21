import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import misRutas from './routes/routes.js';
import db from './config/dbconfig.js';

// IMPORTACIÓN DE TODOS LOS MODELOS
import Doctor from './models/doctorModel.js';
import Clinica from './models/clinicaModel.js'; 
import Paciente from './models/pacienteModel.js';
import Inventario from './models/inventarioModel.js'; 
import Receta from './models/recetaModel.js'; 

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configuración de Pug como motor de plantillas
app.set('view engine', 'pug');
app.set('views', './views');

// Middlewares
app.use(express.urlencoded({ extended: true })); // Para leer datos de formularios
app.use(express.json()); // Para leer JSON
app.use(cookieParser()); // Para leer las cookies del login
app.use(express.static('public')); // Carpeta para tus CSS, JS e imágenes

// ==========================================
// ARQUITECTURA MULTI-CLÍNICA (RELACIONES)
// ==========================================

// 1. Un Doctor tiene muchas Clínicas (y una clínica pertenece a un solo Doctor)
Doctor.hasMany(Clinica, { foreignKey: 'doctorId' });
Clinica.belongsTo(Doctor, { foreignKey: 'doctorId' });

// 2. Una Clínica tiene muchos Pacientes
Clinica.hasMany(Paciente, { foreignKey: 'clinicaId' });
Paciente.belongsTo(Clinica, { foreignKey: 'clinicaId' });

// 3. Una Clínica tiene muchos productos en su Inventario
Clinica.hasMany(Inventario, { foreignKey: 'clinicaId' });
Inventario.belongsTo(Clinica, { foreignKey: 'clinicaId' });

// 4. Una Clínica emite muchas Recetas
Clinica.hasMany(Receta, { foreignKey: 'clinicaId' });
Receta.belongsTo(Clinica, { foreignKey: 'clinicaId' });

// 5. Un Paciente tiene muchas Recetas (Esto se mantiene intacto)
Paciente.hasMany(Receta, { foreignKey: 'pacienteId' });
Receta.belongsTo(Paciente, { foreignKey: 'pacienteId' });

// ==========================================

// Conectar a la base de datos y sincronizar modelos
db.authenticate()
    .then(() => {
        console.log('Conexión exitosa a la base de datos Supabase');
        // alter: true creará las nuevas columnas "clinicaId" en todas tus tablas sin borrar tu info actual
        return db.sync({ alter: true }); 
    })
    .then(() => console.log('Base de datos Multi-Clínica sincronizada correctamente'))
    .catch(error => console.log('Error conectando a la base de datos:', error));

// Definición de Rutas
app.use('/', misRutas);

// Puerto y arranque del servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Dentalink activo en el puerto ${PORT}`);
});