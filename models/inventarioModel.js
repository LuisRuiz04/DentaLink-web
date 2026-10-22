import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const Inventario = db.define('inventarios', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING,
        allowNull: true
    },
    descripcion: {
        type: DataTypes.TEXT,
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
    // ¡AQUÍ ESTABA EL BUG! Lo cambiamos a clinicaId
    clinicaId: { 
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

export default Inventario;