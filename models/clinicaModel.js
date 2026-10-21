import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const Clinica = db.define('Clinica', {
    nombre_clinica: {
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
    }
});

export default Clinica;