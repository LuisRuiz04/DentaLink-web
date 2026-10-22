import Paciente from '../models/pacienteModel.js';
import Odontograma from '../models/odontogramaModel.js';

const verOdontograma = async (req, res) => {
    const { paciente: pacienteId } = req.query;
    const clinicaId = req.clinicaActiva ? req.clinicaActiva.id : null;

    if (!pacienteId || !clinicaId) {
        return res.redirect('/');
    }

    try {
        const paciente = await Paciente.findOne({
            where: { id: pacienteId, clinicaId }
        });

        if (!paciente) {
            return res.redirect('/');
        }

        const odontograma = await Odontograma.findOne({
            where: { pacienteId, clinicaId }
        });

        res.render('odontograma', {
            pagina: 'odontograma',
            paciente,
            hallazgosPrevios: odontograma ? odontograma.hallazgos : {} 
        });

    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
};

const guardarOdontograma = async (req, res) => {
    const { pacienteId, hallazgos } = req.body;
    const clinicaId = req.clinicaActiva ? req.clinicaActiva.id : null;

    try {
        let odontograma = await Odontograma.findOne({ 
            where: { pacienteId, clinicaId } 
        });

        if (odontograma) {
            odontograma.hallazgos = hallazgos;
            await odontograma.save();
        } else {
            await Odontograma.create({
                pacienteId,
                clinicaId,
                hallazgos
            });
        }

        return res.status(200).json({ mensaje: 'Odontograma actualizado correctamente' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ mensaje: 'Hubo un error al guardar' });
    }
};

export {
    verOdontograma,
    guardarOdontograma
};