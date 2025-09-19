// =====================================================
// CLIENTE API - SISTEMA INVENTARIO TEXTIL
// =====================================================

// Clase para manejar todas las llamadas a la API
class ApiClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    // Método genérico para hacer requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            debug('Making request to:', url, config);
            
            const response = await fetch(url, config);
            const data = await response.json();
            
            debug('Response:', data);
            
            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            
            // Manejar errores de red
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(CONFIG.MESSAGES.ERROR_NETWORK);
            }
            
            throw error;
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Instancia del cliente API
const api = new ApiClient(API_BASE_URL);

// =====================================================
// FUNCIONES ESPECÍFICAS DE LA API
// =====================================================

// Funciones para productos
const ProductosAPI = {
    // Obtener todos los productos
    async getAll() {
        try {
            toggleLoading(true);
            const response = await api.get('/api/productos');
            return response.data;
        } catch (error) {
            showAlert(error.message, 'error');
            throw error;
        } finally {
            toggleLoading(false);
        }
    },

    // Obtener producto por ID
    async getById(id) {
        try {
            const response = await api.get(`/api/productos/${id}`);
            return response.data;
        } catch (error) {
            showAlert(error.message, 'error');
            throw error;
        }
    },

    // Crear nuevo producto
    async create(productData) {
        try {
            toggleLoading(true);
            const response = await api.post('/api/productos', productData);
            showAlert(CONFIG.MESSAGES.SUCCESS_CREATE, 'success');
            return response.data;
        } catch (error) {
            showAlert(error.message, 'error');
            throw error;
        } finally {
            toggleLoading(false);
        }
    },

    // Validar datos del producto antes de enviar
    validate(productData) {
        const rules = {
            codigo: {
                required: true,
                label: 'Código',
                minLength: CONFIG.VALIDATION.CODIGO_MIN_LENGTH,
                maxLength: CONFIG.VALIDATION.CODIGO_MAX_LENGTH,
                pattern: /^[A-Z0-9]+$/
            },
            nombre: {
                required: true,
                label: 'Nombre',
                minLength: CONFIG.VALIDATION.NOMBRE_MIN_LENGTH
            },
            precio: {
                required: true,
                label: 'Precio',
                min: CONFIG.VALIDATION.PRECIO_MIN
            }
        };

        return validateForm(productData, rules);
    }
};

// Funciones para inventario
const InventarioAPI = {
    // Obtener resumen del inventario
    async getResumen() {
        try {
            toggleLoading(true);
            const response = await api.get('/api/inventario');
            return response.data;
        } catch (error) {
            showAlert(error.message, 'error');
            throw error;
        } finally {
            toggleLoading(false);
        }
    }
};

// =====================================================
// FUNCIONES DE UTILIDAD PARA LA UI
// =====================================================

// Función para poblar una tabla con datos de productos
function populateProductsTable(productos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!productos || productos.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>No hay productos registrados</p>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Color</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(producto => `
                        <tr>
                            <td><strong>${producto.codigo}</strong></td>
                            <td>${producto.nombre}</td>
                            <td>${producto.tipo_tela || 'N/A'}</td>
                            <td>${producto.color || 'N/A'}</td>
                            <td>${formatCurrency(producto.precio)}</td>
                            <td>
                                <span class="stock-badge ${producto.stock_actual <= producto.stock_minimo ? 'stock-low' : 'stock-ok'}">
                                    ${producto.stock_actual}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge ${producto.stock_actual <= producto.stock_minimo ? 'status-warning' : 'status-success'}">
                                    ${producto.stock_actual <= producto.stock_minimo ? 'Stock Bajo' : 'Disponible'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-secondary" onclick="verDetalle(${producto.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = tableHTML;
}

// Función para llenar estadísticas en el dashboard
function updateDashboardStats(statsData) {
    const elements = {
        totalProductos: document.getElementById('totalProductos'),
        stockBajo: document.getElementById('stockBajo'),
        valorTotal: document.getElementById('valorTotal')
    };

    if (elements.totalProductos) {
        elements.totalProductos.textContent = statsData.totalProductos || '0';
    }
    
    if (elements.stockBajo) {
        elements.stockBajo.textContent = statsData.productosStockBajo || '0';
        
        // Cambiar color si hay productos con stock bajo
        const parentCard = elements.stockBajo.closest('.stat-card');
        if (parentCard && statsData.productosStockBajo > 0) {
            parentCard.classList.add('warning');
        }
    }
    
    if (elements.valorTotal) {
        elements.valorTotal.textContent = formatCurrency(statsData.valorTotal || 0);
    }
}

// Función para generar reporte (placeholder)
async function generarReporte() {
    try {
        showAlert('Generando reporte...', 'info');
        
        const productos = await ProductosAPI.getAll();
        const inventario = await InventarioAPI.getResumen();
        
        // Crear datos del reporte
        const reportData = {
            fecha: new Date().toLocaleDateString('es-PE'),
            totalProductos: inventario.totalProductos,
            valorTotal: inventario.valorTotal,
            productosStockBajo: inventario.productosStockBajo,
            productos: productos
        };
        
        // Convertir a texto plano para descarga
        const reportText = generateReportText(reportData);
        downloadTextFile(reportText, `reporte-inventario-${new Date().toISOString().split('T')[0]}.txt`);
        
        showAlert('Reporte generado y descargado exitosamente', 'success');
        
    } catch (error) {
        showAlert('Error al generar reporte: ' + error.message, 'error');
    }
}

// Función para generar texto del reporte
function generateReportText(data) {
    return `
REPORTE DE INVENTARIO TEXTIL
============================
Fecha: ${data.fecha}
Total de Productos: ${data.totalProductos}
Valor Total: S/ ${data.valorTotal}
Productos con Stock Bajo: ${data.productosStockBajo}

DETALLE DE PRODUCTOS:
${data.productos.map((p, index) => `
${index + 1}. ${p.codigo} - ${p.nombre}
   Tipo: ${p.tipo_tela || 'N/A'}
   Color: ${p.color || 'N/A'}  
   Precio: S/ ${p.precio}
   Stock: ${p.stock_actual} (Mín: ${p.stock_minimo})
   Estado: ${p.stock_actual <= p.stock_minimo ? 'STOCK BAJO' : 'DISPONIBLE'}
`).join('')}

---
Generado por Sistema de Inventario Textil
Equipo: Gabriel, Fabio, Lucila, Oscar
    `.trim();
}

// Función para descargar archivo de texto
function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Función para ver detalle de producto (placeholder)
function verDetalle(productId) {
    showAlert(`Ver detalle del producto ID: ${productId}`, 'info');
    // Aquí se puede implementar un modal o redirección
}

console.log('✅ Cliente API cargado correctamente');