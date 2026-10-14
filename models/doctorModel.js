import { DataTypes } from 'sequelize';
import db from '../config/dbconfig.js'; // Ojo al .js al final
import bcrypt from 'bcrypt';

const Doctor = db.define('Doctor', {
    nombre_doctor: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nombre_clinica: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    hooks: {
        beforeCreate: async (doctor) => {
            const salt = await bcrypt.genSalt(10);
            doctor.password = await bcrypt.hash(doctor.password, salt);
        }
    }
});

Doctor.prototype.verificarPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

// ¡Cambio aquí!
export default Doctor;