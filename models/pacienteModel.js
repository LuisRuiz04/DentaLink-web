import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js'; // Ojo al .js al final

const Paciente = db.define('Paciente', {
    nombres: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apellidos: {
        type: DataTypes.STRING,
        allowNull: false
    },
    edad: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: true
    },
    numero_expediente: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    }
});

// ¡Cambio aquí!
export default Paciente;