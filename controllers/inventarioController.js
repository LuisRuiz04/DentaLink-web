import Inventario from '../models/inventarioModel.js';

const agregarProducto = async (req, res) => {
    const { nombre, categoria, descripcion, cantidad, stock_minimo } = req.body;
    try {
        await Inventario.create({
            nombre,
            categoria: categoria ? categoria.charAt(0).toUpperCase() + categoria.slice(1).toLowerCase() : null,
            descripcion,
            cantidad,
            stock_minimo,
            clinicaId: req.clinicaActiva.id // ¡Vinculado exclusivamente a la clínica actual!
        });
        res.redirect('/inventario');
    } catch (error) {
        console.log("Error al agregar producto:", error);
        res.redirect('/inventario');
    }
};

const actualizarProducto = async (req, res) => {
    const { id } = req.params;
    const { nombre, categoria, descripcion, cantidad, stock_minimo } = req.body;
    try {
        // Buscamos que el producto exista y que además pertenezca a la clínica activa
        const producto = await Inventario.findOne({ where: { id, clinicaId: req.clinicaActiva.id } });
        if (producto) {
            await producto.update({ 
                nombre, 
                categoria: categoria ? categoria.charAt(0).toUpperCase() + categoria.slice(1).toLowerCase() : null, 
                descripcion, 
                cantidad, 
                stock_minimo 
            });
        }
        res.redirect('/inventario');
    } catch (error) {
        console.log("Error al actualizar producto:", error);
        res.redirect('/inventario');
    }
};

const ajustarStock = async (req, res) => {
    const { id } = req.params;
    const { cantidad } = req.body; 

    try {
        const producto = await Inventario.findOne({ where: { id, clinicaId: req.clinicaActiva.id } });
        if (producto) {
            await producto.update({ cantidad: parseInt(cantidad) });
        }
        res.redirect('/inventario');
    } catch (error) {
        console.log("Error al guardar stock:", error);
        res.redirect('/inventario');
    }
};

const eliminarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        const producto = await Inventario.findOne({ where: { id, clinicaId: req.clinicaActiva.id } });
        if (producto) {
            await producto.destroy();
        }
        res.redirect('/inventario');
    } catch (error) {
        console.log("Error al eliminar producto:", error);
        res.redirect('/inventario');
    }
};

export { agregarProducto, actualizarProducto, ajustarStock, eliminarProducto };