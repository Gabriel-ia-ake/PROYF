// SERVIDOR CON SWAGGER - SISTEMA INVENTARIO TEXTIL
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { query, testConnection } = require('./config/db');
const app = express();
const PORT = 3001;
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

testConnection();

// API CON DOCUMENTACIÓN SWAGGER
/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener todos los productos
 *     description: Retorna la lista completa de productos textiles registrados en el sistema
 *     tags:
 *       - Productos
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Producto'
 *                     total:
 *                       type: integer
 *                       example: 3
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
app.get('/api/productos', async (req, res) => {
    try {
        const result = await query('SELECT * FROM productos ORDER BY id');
        
        res.json({
            success: true,
            message: 'Productos obtenidos desde PostgreSQL',
            data: result.rows,
            total: result.rows.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     description: Retorna la información detallada de un producto específico
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del producto
 *         example: 1
 *     responses:
 *       200:
 *         description: Producto encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Producto'
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Error interno del servidor
 */
app.get('/api/productos/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID debe ser un número válido'
            });
        }
        
        const result = await query('SELECT * FROM productos WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Producto con ID ${id} no encontrado`
            });
        }
        
        res.json({
            success: true,
            message: 'Producto encontrado',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crear nuevo producto
 *     description: Registra un nuevo producto textil en el sistema de inventario
 *     tags:
 *       - Productos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NuevoProducto'
 *           examples:
 *             ejemplo1:
 *               summary: Ejemplo de tela de algodón
 *               value:
 *                 codigo: "TEL005"
 *                 nombre: "Algodón Azul Cielo"
 *                 tipo_tela: "Algodón"
 *                 color: "Azul Cielo"
 *                 precio: 28.50
 *                 stock_actual: 75
 *                 stock_minimo: 15
 *             ejemplo2:
 *               summary: Ejemplo de tela sintética
 *               value:
 *                 codigo: "TEL006"
 *                 nombre: "Poliéster Verde"
 *                 tipo_tela: "Poliéster"
 *                 color: "Verde"
 *                 precio: 22.00
 *                 stock_actual: 40
 *                 stock_minimo: 10
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Datos inválidos o código duplicado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Error interno del servidor
 */
app.post('/api/productos', async (req, res) => {
    try {
        const { codigo, nombre, tipo_tela, color, precio, stock_actual, stock_minimo } = req.body;
        
        if (!codigo || !nombre || !precio) {
            return res.status(400).json({
                success: false,
                message: 'Los campos código, nombre y precio son obligatorios',
                camposRequeridos: ['codigo', 'nombre', 'precio']
            });
        }
        
        if (precio <= 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser mayor a 0'
            });
        }
        
        const result = await query(`
            INSERT INTO productos (codigo, nombre, tipo_tela, color, precio, stock_actual, stock_minimo) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *
        `, [
            codigo.trim().toUpperCase(),
            nombre.trim(),
            tipo_tela?.trim() || null,
            color?.trim() || null,
            parseFloat(precio),
            parseInt(stock_actual) || 0,
            parseInt(stock_minimo) || 5
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente en la base de datos',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error al crear producto:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'El código del producto ya existe en el sistema',
                error: 'CODIGO_DUPLICADO'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/inventario:
 *   get:
 *     summary: Obtener resumen del inventario
 *     description: Retorna estadísticas generales del inventario incluyendo total de productos, stock bajo y valor total
 *     tags:
 *       - Inventario
 *     responses:
 *       200:
 *         description: Resumen obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ResumenInventario'
 *       500:
 *         description: Error interno del servidor
 */
app.get('/api/inventario', async (req, res) => {
    try {
        // Consultas para el resumen
        const totalResult = await query('SELECT COUNT(*) as total FROM productos');
        const stockBajoResult = await query('SELECT COUNT(*) as stock_bajo FROM productos WHERE stock_actual <= stock_minimo');
        const valorResult = await query('SELECT SUM(precio * stock_actual) as valor_total FROM productos');
        const productosStockBajo = await query('SELECT codigo, nombre, stock_actual, stock_minimo FROM productos WHERE stock_actual <= stock_minimo ORDER BY stock_actual ASC');
        
        res.json({
            success: true,
            message: 'Resumen de inventario obtenido correctamente',
            data: {
                totalProductos: parseInt(totalResult.rows[0].total),
                productosStockBajo: parseInt(stockBajoResult.rows[0].stock_bajo),
                valorTotal: parseFloat(valorResult.rows[0].valor_total || 0).toFixed(2),
                productosConStockBajo: productosStockBajo.rows
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener inventario',
            error: error.message
        });
    }
});

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        ruta: req.originalUrl,
        metodo: req.method,
        documentacion: 'http://localhost:3001/api-docs'
    });
});

app.use((err, req, res, next) => {
    console.error('Error no manejado:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Error del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`Documentación Swagger: http://localhost:${PORT}/api-docs`);
});

module.exports = app;