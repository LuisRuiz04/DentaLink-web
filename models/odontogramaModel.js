import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const Odontograma = db.define('odontogramas', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    hallazgos: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
    }
});

export default Odontograma;