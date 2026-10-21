import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const Receta = db.define('recetas', {
    folio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    medicamentos: {
        type: DataTypes.JSON, // Guardaremos el arreglo de medicinas aquí
        allowNull: false
    }
});

export default Receta;