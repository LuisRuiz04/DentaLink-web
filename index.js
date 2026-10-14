import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import misRutas from './routes/routes.js';
import db from './config/dbconfig.js';
import Doctor from './models/doctorModel.js';
import Paciente from './models/pacienteModel.js';

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

// Definir las relaciones (1 a Muchos)
// Un Doctor tiene muchos Pacientes, y un Paciente pertenece a un Doctor
Doctor.hasMany(Paciente, { foreignKey: 'doctorId' });
Paciente.belongsTo(Doctor, { foreignKey: 'doctorId' });

// Conectar a la base de datos y sincronizar modelos
db.authenticate()
    .then(() => {
        console.log('Conexión exitosa a la base de datos Supabase');
        // Usamos alter: true para que actualice las tablas sin borrar datos
        return db.sync({ alter: true }); 
    })
    .then(() => console.log('Modelos de Doctor y Paciente sincronizados correctamente'))
    .catch(error => console.log('Error conectando a la base de datos:', error));

// Definición de Rutas
app.use('/', misRutas);

// Puerto y arranque del servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Dentalink activo en el puerto ${PORT}`);
});