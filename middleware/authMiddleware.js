import jwt from 'jsonwebtoken';
import Doctor from '../models/doctorModel.js';
// IMPORTAMOS EL NUEVO MODELO DE CLÍNICA
import Clinica from '../models/clinicaModel.js'; 

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
            req.doctor = doctor; 

            // --- NUEVA LÓGICA MULTI-CLÍNICA ---
            // Buscar todas las clínicas que le pertenecen a este doctor
            const misClinicas = await Clinica.findAll({ where: { doctorId: doctor.id } });
            
            // Determinar la clínica activa (por defecto la primera que creó)
            let clinicaActiva = misClinicas.length > 0 ? misClinicas[0] : null; 
            
            // Si el doctor ya había seleccionado una clínica diferente (guardada en una cookie)
            if (req.cookies._clinicaActivaId && misClinicas.length > 0) {
                const encontrada = misClinicas.find(c => c.id == req.cookies._clinicaActivaId);
                if (encontrada) clinicaActiva = encontrada;
            }

            // Pasar estas variables a TODAS las vistas automáticamente (para que funcione el menú desplegable en layout.pug)
            res.locals.doctor = doctor;
            res.locals.misClinicas = misClinicas;
            res.locals.clinicaActiva = clinicaActiva;
            
            // Guardamos la clínica activa en el request para que los controladores guarden ahí a los pacientes/inventario
            req.clinicaActiva = clinicaActiva;
            // -----------------------------------

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