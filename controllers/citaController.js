import Cita from '../models/citaModel.js';
import Paciente from '../models/pacienteModel.js';
// Opcional: importaremos moment.js u otra librería de fechas si te gusta, 
// pero podemos hacerlo con JS nativo para no meter más paquetes.

const obtenerCitas = async (req, res) => {
    try {
        // Traemos las citas de la clínica actual, y también los datos del paciente (para saber su nombre)
        const citas = await Cita.findAll({
            where: { clinicaId: req.clinicaActiva.id },
            include: [{ model: Paciente, attributes: ['nombre', 'apellidos'] }],
            order: [['fecha', 'ASC'], ['hora_inicio', 'ASC']]
        });
        
        // Aquí mandaríamos las citas a tu vista dashboard (lo haremos en el siguiente paso)
        res.json(citas); 
    } catch (error) {
        console.error("Error al obtener citas:", error);
        res.status(500).send("Error interno");
    }
};

const agendarCita = async (req, res) => {
    const { pacienteId, fecha, hora_inicio, hora_fin, motivo } = req.body;
    try {
        await Cita.create({
            fecha,
            hora_inicio,
            hora_fin,
            motivo,
            estado: 'Pendiente',
            pacienteId,
            clinicaId: req.clinicaActiva.id
        });
        // Si todo sale bien, recargamos el dashboard
        res.redirect('/');
    } catch (error) {
        console.error("Error al agendar cita:", error);
        res.redirect('/');
    }
};

const completarCita = async (req, res) => {
    const { id } = req.params;
    const { crear_seguimiento, dias_siguiente_cita } = req.body;

    try {
        // 1. Buscamos la cita actual
        const citaActual = await Cita.findOne({ 
            where: { id, clinicaId: req.clinicaActiva.id } 
        });

        if (!citaActual) {
            return res.status(404).send("Cita no encontrada");
        }

        // 2. Marcamos la cita actual como completada
        await citaActual.update({ estado: 'Completada' });

        // 3. LA MAGIA DEL SEGUIMIENTO AUTOMÁTICO
        if (crear_seguimiento === 'si' && dias_siguiente_cita) {
            
            // Tomamos la fecha de la cita que se acaba de completar
            const fechaBase = new Date(citaActual.fecha);
            
            // Le sumamos los días que indicó el doctor (ej. 30 días)
            // Cuidado: Al sumar días en JS, a veces hay problemas con la zona horaria, 
            // setDate es la forma más segura.
            fechaBase.setDate(fechaBase.getDate() + parseInt(dias_siguiente_cita) + 1); // +1 por compensación UTC si aplica, luego lo ajustaremos si es necesario.
            
            // Formateamos la nueva fecha a YYYY-MM-DD para guardarla
            const nuevaFechaStr = fechaBase.toISOString().split('T')[0];

            // Creamos la nueva cita clonando los datos de la anterior
            await Cita.create({
                fecha: nuevaFechaStr,
                hora_inicio: citaActual.hora_inicio, // Le reservamos a la misma hora
                hora_fin: citaActual.hora_fin,
                motivo: `Seguimiento: ${citaActual.motivo}`, // Le agregamos la palabra Seguimiento
                estado: 'Pendiente',
                pacienteId: citaActual.pacienteId,
                clinicaId: req.clinicaActiva.id
            });
        }

        res.redirect('/');

    } catch (error) {
        console.error("Error al completar cita:", error);
        res.redirect('/');
    }
};

const cancelarCita = async (req, res) => {
    const { id } = req.params;
    try {
        const cita = await Cita.findOne({ where: { id, clinicaId: req.clinicaActiva.id } });
        if (cita) {
            await cita.update({ estado: 'Cancelada' });
        }
        res.redirect('/');
    } catch (error) {
        console.error("Error al cancelar cita:", error);
        res.redirect('/');
    }
};
const editarCita = async (req, res) => {
    const { id } = req.params;
    const { fecha, hora_inicio, hora_fin, motivo, estado } = req.body;
    
    try {
        const cita = await Cita.findOne({ where: { id, clinicaId: req.clinicaActiva.id } });
        if (cita) {
            await cita.update({
                fecha,
                hora_inicio,
                hora_fin,
                motivo,
                // Si mandan un nuevo estado lo actualiza, si no, deja el que ya tenía
                estado: estado || cita.estado 
            });
        }
        res.redirect('/');
    } catch (error) {
        console.error("Error al editar cita:", error);
        res.redirect('/');
    }
};

export { obtenerCitas, agendarCita, completarCita, cancelarCita, editarCita };