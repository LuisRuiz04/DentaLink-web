import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js'; // Asegúrate de que esta ruta sea la de tu conexión
import Doctor from './doctorModel.js';

const Inventario = db.define('inventarios', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: true
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    stock_minimo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5
    },
    // Relación con el doctor
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

export default Inventario;