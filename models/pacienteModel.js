import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const Paciente = db.define('pacientes', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apellidos: {
        type: DataTypes.STRING,
        allowNull: false
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: false
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    correo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Este campo es la clave foránea (Foreign Key) para saber de qué doctor es
    doctorId: { 
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

export default Paciente;