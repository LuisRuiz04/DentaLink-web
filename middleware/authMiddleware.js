import jwt from 'jsonwebtoken';
import Doctor from '../models/doctorModel.js';

const protegerRuta = async (req, res, next) => {
    // 1. Verificamos si existe el gafete (cookie '_token')
    const token = req.cookies ? req.cookies._token : null;

    // Si no trae token, lo mandamos directo a que inicie sesión
    if (!token) {
        return res.redirect('/auth');
    }

    // 2. Si sí trae token, verificamos que sea auténtico
    try {
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscamos al doctor en la base de datos para confirmar que siga existiendo
        const doctor = await Doctor.findByPk(decodificado.id);

        if (doctor) {
            // Guardamos los datos del doctor en el request para poder usarlos en las vistas
            req.doctor = doctor; 
            return next(); // Le abrimos la cadena, ¡pásale al Dashboard!
        } else {
            return res.redirect('/auth');
        }

    } catch (error) {
        // Si el token es falso o ya caducó, le borramos la cookie y lo corremos al login
        return res.clearCookie('_token').redirect('/auth');
    }
};

export default protegerRuta;