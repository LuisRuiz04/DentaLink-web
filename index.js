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
import Cita from './models/citaModel.js';
import Odontograma from './models/odontogramaModel.js';

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configuración de Pug como motor de plantillas
app.set('view engine', 'pug');
app.set('views', './views');

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(cookieParser()); 
app.use(express.static('public')); 

// ==========================================
// ARQUITECTURA MULTI-CLÍNICA (RELACIONES)
// ==========================================

// 1. Un Doctor tiene muchas Clínicas
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

// 5. Un Paciente tiene muchas Recetas
Paciente.hasMany(Receta, { foreignKey: 'pacienteId' });
Receta.belongsTo(Paciente, { foreignKey: 'pacienteId' });

// 6. Una Clínica tiene muchas Citas
Clinica.hasMany(Cita, { foreignKey: 'clinicaId' });
Cita.belongsTo(Clinica, { foreignKey: 'clinicaId' });

// 7. Un Paciente tiene muchas Citas
Paciente.hasMany(Cita, { foreignKey: 'pacienteId' });
Cita.belongsTo(Paciente, { foreignKey: 'pacienteId' });

// 8. Una Clínica tiene muchos Odontogramas
Clinica.hasMany(Odontograma, { foreignKey: 'clinicaId' });
Odontograma.belongsTo(Clinica, { foreignKey: 'clinicaId' });

// 9. Un Paciente tiene un Odontograma
Paciente.hasOne(Odontograma, { foreignKey: 'pacienteId' });
Odontograma.belongsTo(Paciente, { foreignKey: 'pacienteId' });

// ==========================================

// Conectar a la base de datos y sincronizar modelos
db.authenticate()
    .then(() => {
        console.log('Conexión exitosa a la base de datos Supabase');
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