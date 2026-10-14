import Doctor from '../models/doctorModel.js';

const registrarDoctor = async (req, res) => {
    // Extraemos los datos del formulario (los 'name' de tus inputs)
    const { nombre_doctor, nombre_clinica, email, password } = req.body;

    try {
        // 1. Verificar si el correo ya está registrado en la base de datos
        const existeDoctor = await Doctor.findOne({ where: { email } });
        
        if (existeDoctor) {
            console.log("El correo ya está registrado");
            // Por ahora recargamos la vista, luego le pondremos una alerta visual bonita
            return res.render('auth'); 
        }

        // 2. Guardar el nuevo doctor (Tu modelo ya se encarga de encriptar el password automáticamente)
        await Doctor.create({
            nombre_doctor,
            nombre_clinica,
            email,
            password
        });

        console.log("¡Doctor registrado con éxito!");
        // 3. Redirigimos al inicio para que inicie sesión
        res.redirect('/'); 

    } catch (error) {
        console.log("Error al registrar al doctor: ", error);
    }
};

export { registrarDoctor };