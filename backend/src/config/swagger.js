const swaggerJSDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Sistema de Inventario Textil',
      version: '1.0.0',
      description: 'API REST para gestión de inventario de empresa textil - Primer Avance',
      contact: {
        name: 'Equipo de Desarrollo',
        email: 'team@inventario-textil.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      schemas: {
        Producto: {
          type: 'object',
          required: ['codigo', 'nombre', 'precio'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del producto',
              example: 1
            },
            codigo: {
              type: 'string',
              description: 'Código único del producto',
              example: 'TEL001'
            },
            nombre: {
              type: 'string',
              description: 'Nombre descriptivo del producto',
              example: 'Algodón Blanco Premium'
            },
            tipo_tela: {
              type: 'string',
              description: 'Tipo de material textil',
              example: 'Algodón'
            },
            color: {
              type: 'string',
              description: 'Color principal de la tela',
              example: 'Blanco'
            },
            precio: {
              type: 'number',
              format: 'decimal',
              description: 'Precio por metro en soles',
              example: 25.50
            },
            stock_actual: {
              type: 'integer',
              description: 'Cantidad actual en inventario',
              example: 100
            },
            stock_minimo: {
              type: 'integer',
              description: 'Stock mínimo requerido',
              example: 10
            },
            fecha_creacion: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación del registro'
            }
          }
        },
        NuevoProducto: {
          type: 'object',
          required: ['codigo', 'nombre', 'precio'],
          properties: {
            codigo: {
              type: 'string',
              description: 'Código único del producto',
              example: 'TEL004'
            },
            nombre: {
              type: 'string',
              description: 'Nombre descriptivo del producto',
              example: 'Seda Rosa Natural'
            },
            tipo_tela: {
              type: 'string',
              description: 'Tipo de material textil',
              example: 'Seda'
            },
            color: {
              type: 'string',
              description: 'Color principal de la tela',
              example: 'Rosa'
            },
            precio: {
              type: 'number',
              format: 'decimal',
              description: 'Precio por metro en soles',
              example: 85.00
            },
            stock_actual: {
              type: 'integer',
              description: 'Cantidad inicial en inventario',
              example: 25
            },
            stock_minimo: {
              type: 'integer',
              description: 'Stock mínimo requerido',
              example: 5
            }
          }
        },
        ResumenInventario: {
          type: 'object',
          properties: {
            totalProductos: {
              type: 'integer',
              description: 'Total de productos registrados',
              example: 5
            },
            productosStockBajo: {
              type: 'integer',
              description: 'Productos con stock menor o igual al mínimo',
              example: 2
            },
            valorTotal: {
              type: 'string',
              description: 'Valor total del inventario en soles',
              example: '15250.75'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la operación fue exitosa'
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo de la respuesta'
            },
            data: {
              type: 'object',
              description: 'Datos de respuesta'
            },
            error: {
              type: 'string',
              description: 'Mensaje de error (solo si success es false)'
            }
          }
        }
      }
    }
  },
  apis: ['./src/server.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

module.exports = swaggerSpec;