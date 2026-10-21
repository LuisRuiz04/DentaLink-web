import Clinica from '../models/clinicaModel.js';

// Función para crear una clínica nueva desde el Modal
export const agregarClinica = async (req, res) => {
    const { nombre_clinica, telefono, direccion } = req.body;
    try {
        await Clinica.create({
            nombre_clinica,
            telefono,
            direccion,
            doctorId: req.doctor.id // El dueño es el doctor logueado
        });
        res.redirect(req.get('referer') || '/'); 
    } catch (error) {
        console.log("Error al crear clínica:", error);
        res.redirect('/');
    }
};

// Función para alternar entre clínicas en el menú desplegable
export const cambiarClinica = (req, res) => {
    const { id } = req.params;
    // Guardamos el ID de la clínica seleccionada en una cookie
    res.cookie('_clinicaActivaId', id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    });
    // Recargamos el dashboard
    res.redirect(req.get('referer') || '/');
};

// Función para editar los datos de un consultorio existente
export const editarClinica = async (req, res) => {
    const { id } = req.params;
    const { nombre_clinica, telefono, direccion } = req.body;
    
    try {
        // Aseguramos que la clínica le pertenezca a este doctor antes de actualizar
        const clinica = await Clinica.findOne({ where: { id, doctorId: req.doctor.id } });
        
        if (clinica) {
            await clinica.update({ nombre_clinica, telefono, direccion });
        }
        
        res.redirect(req.get('referer') || '/');
    } catch (error) {
        console.log("Error al editar clínica:", error);
        res.redirect('/');
    }
};

// Función para eliminar un consultorio
export const eliminarClinica = async (req, res) => {
    const { id } = req.params;
    
    try {
        const clinica = await Clinica.findOne({ where: { id, doctorId: req.doctor.id } });
        
        if (clinica) {
            await clinica.destroy();
            
            // Si la clínica que eliminó era la que tenía abierta, borramos la memoria para evitar errores
            if (req.cookies._clinicaActivaId === id) {
                res.clearCookie('_clinicaActivaId');
            }
        }
        
        res.redirect('/');
    } catch (error) {
        console.log("Error al eliminar clínica:", error);
        res.redirect('/');
    }
};