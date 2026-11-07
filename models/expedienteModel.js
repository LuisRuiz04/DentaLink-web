import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

const ExpedienteNota = db.define('expediente_notas', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    nota: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

export default ExpedienteNota;