import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js';

// Chat entre la CLÍNICA y el paciente (no con un doctor en particular).
// Una conversación = la pareja (clinicaId, pacienteId).
const Mensaje = db.define('mensajes', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Quién lo escribió: 'clinica' (la web) o 'paciente' (la app móvil)
    remitente: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: { isIn: [['clinica', 'paciente']] }
    },
    texto: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    // true cuando el OTRO lado ya lo vio (palomitas azules / bolita roja)
    leido: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    // LLAVES FORÁNEAS
    clinicaId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pacienteId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    indexes: [
        { fields: ['clinicaId', 'pacienteId', 'id'] },
        { fields: ['clinicaId', 'remitente', 'leido'] }
    ]
});

export default Mensaje;
