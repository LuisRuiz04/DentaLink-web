import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import misRutas from './routes/routes.js';

// Cargar variables de entorno (tu futuro .env)
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

// Definición de Rutas
app.use('/', misRutas);

// Puerto y arranque del servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Dentalink activo ${PORT}`);
});