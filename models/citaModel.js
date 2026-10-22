import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const Cita = db.define('citas', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha: {
        type: DataTypes.DATEONLY, // Solo guarda "YYYY-MM-DD"
        allowNull: false
    },
    hora_inicio: {
        type: DataTypes.TIME, // Guarda "HH:MM:SS"
        allowNull: false
    },
    hora_fin: {
        type: DataTypes.TIME,
        allowNull: false
    },
    motivo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado: {
        type: DataTypes.STRING,
        defaultValue: 'Pendiente' // Opciones: Pendiente, Completada, Cancelada
    },
    // LLAVES FORÁNEAS
    pacienteId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    clinicaId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

export default Cita;