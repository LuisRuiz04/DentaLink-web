# DentaLink - Sistema de Gestion Clinica Odontologica

DentaLink es una aplicacion web y movil desarrollada bajo una arquitectura MVC (Modelo-Vista-Controlador) disenada para optimizar la administracion de consultorios dentales. Permite llevar un control integral de la agenda de citas, expedientes clinicos, odontogramas interactivos, historiales fotograficos, recetas medicas con exportacion a PDF y control de inventario con alertas de stock.

---

## Tecnologias Utilizadas

- Backend y Servidor: Node.js, Express.js
- Motor de Vistas: Pug
- Manejo de Cookies: cookie-parser
- Desarrollo en Vivo: Nodemon
- Base de datos y ORM: PostgreSQL (Supabase), Sequelize
- Estilos: CSS Modular / Diseno adaptado (Cian #00A5C4, Menta #E0F7F1)

---

## Requisitos Previos e Instalacion desde Cero

Sigue estos pasos detallados para instalar todo lo necesario y poner a andar el proyecto en tu equipo:

1. Instalar Git y Node.js:
- Descarga e instala Git desde su sitio oficial si no lo tienes.
- Descarga e instala Node.js (se recomienda la version LTS de Node.js 18 o superior, la cual incluye automaticamente el manejador de paquetes npm). Puedes verificar su correcta instalacion abriendo tu terminal y ejecutando:
node -v
npm -v

2. Clonar el repositorio:
git clone https://github.com/LuisRuiz04/DentaLink-web.git
cd DentaLink

3. Instalar las dependencias del proyecto (incluyendo express, pug, sequelize, pg, nodemon y cookie-parser):
npm install

4. Configurar las variables de entorno (.env):
Crea un archivo llamado .env en la raiz del proyecto con la siguiente estructura:
PORT=3000
DB_HOST=tu_host_de_supabase_o_postgres
DB_USER=tu_usuario
DB_PASSWORD=tu_contrasena
DB_NAME=tu_nombre_de_base_de_datos
DB_PORT=5432

---

## Como Correr el Proyecto

Para iniciar el servidor en modo de desarrollo con Nodemon (el cual proporciona recarga automatica en tiempo real ante cualquier cambio):
npm run dev

Una vez que el servidor se encuentre activo, abre tu navegador web de preferencia e ingresa a:
http://localhost:3000

---

## Estructura del Proyecto (MVC)

DentaLink/
├── config/         # Configuracion de base de datos y conexiones
├── controllers/    # Logica de controladores de la aplicacion
├── middleware/     # Funciones intermedias (autenticacion, validaciones, cookie-parser)
├── models/         # Modelos de Sequelize (PostgreSQL)
├── public/         # Archivos estaticos (CSS, imagenes, scripts de cliente)
├── routes/         # Definicion de rutas web y endpoints de Express
├── views/          # Vistas modulares en Pug (dashboard, expediente, receta, etc.)
├── .env            # Variables de entorno locales
├── .gitignore      # Archivos ignorados por Git
├── index.js        # Archivo principal de entrada al servidor Express
└── package.json    # Dependencias y scripts del proyecto

---

