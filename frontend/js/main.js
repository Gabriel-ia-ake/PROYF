// =====================================================
// JAVASCRIPT PRINCIPAL - SISTEMA INVENTARIO TEXTIL
// =====================================================

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de Inventario Textil iniciado');
    
    // Inicializar la aplicación
    initApp();
});

// Función principal de inicialización
async function initApp() {
    try {
        // Verificar si estamos en la página principal
        const currentPage = getCurrentPage();
        console.log('📄 Página actual:', currentPage);
        
        // Ejecutar funciones específicas según la página
        switch(currentPage) {
            case 'index':
                await initDashboard();
                break;
            case 'productos':
                await initProductos();
                break;
            case 'inventario':
                await initInventario();
                break;
            default:
                console.log('Página no reconocida, cargando funcionalidades básicas');
        }
        
        // Inicializar funcionalidades globales
        initGlobalFeatures();
        
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showAlert('Error al cargar la aplicación. Verifica que el servidor esté ejecutándose.', 'error');
    }
}

// Función para obtener la página actual
function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    
    if (filename === '' || filename === 'index.html') {
        return 'index';
    } else if (filename === 'productos.html') {
        return 'productos';
    } else if (filename === 'inventario.html') {
        return 'inventario';
    }
    
    return 'unknown';
}

// =====================================================
// INICIALIZACIÓN DEL DASHBOARD (PÁGINA PRINCIPAL)
// =====================================================
async function initDashboard() {
    console.log('🏠 Inicializando dashboard...');
    
    try {
        // Cargar estadísticas del inventario
        const statsData = await InventarioAPI.getResumen();
        updateDashboardStats(statsData);
        
        console.log('✅ Dashboard cargado correctamente');
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        
        // Mostrar valores por defecto en caso de error
        updateDashboardStats({
            totalProductos: 'Error',
            productosStockBajo: 'Error',
            valorTotal: 'Error'
        });
    }
}

// =====================================================
// INICIALIZACIÓN DE PRODUCTOS
// =====================================================
async function initProductos() {
    console.log('📦 Inicializando página de productos...');
    
    try {
        // Cargar lista de productos
        await loadProductsList();
        
        // Inicializar formulario si existe
        initProductForm();
        
        console.log('✅ Página de productos cargada correctamente');
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Función para cargar la lista de productos
async function loadProductsList() {
    try {
        const productos = await ProductosAPI.getAll();
        populateProductsTable(productos, 'productosTableContainer');
        
        // Actualizar contador si existe
        const contador = document.getElementById('productosCount');
        if (contador) {
            contador.textContent = productos.length;
        }
        
    } catch (error) {
        console.error('Error al cargar lista de productos:', error);
        
        // Mostrar mensaje de error en la tabla
        const container = document.getElementById('productosTableContainer');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar productos. Verifica que el servidor esté funcionando.
                </div>
            `;
        }
    }
}

// Función para inicializar el formulario de productos
function initProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    
    console.log('📝 Inicializando formulario de productos...');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleProductSubmit(form);
    });
    
    // Auto-formatear código a mayúsculas
    const codigoInput = form.querySelector('#codigo');
    if (codigoInput) {
        codigoInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

// Función para manejar el envío del formulario de productos
async function handleProductSubmit(form) {
    try {
        // Obtener datos del formulario
        const formData = new FormData(form);
        const productData = {
            codigo: formData.get('codigo')?.trim().toUpperCase(),
            nombre: formData.get('nombre')?.trim(),
            tipo_tela: formData.get('tipo_tela')?.trim(),
            color: formData.get('color')?.trim(),
            precio: parseFloat(formData.get('precio')),
            stock_actual: parseInt(formData.get('stock_actual')) || 0,
            stock_minimo: parseInt(formData.get('stock_minimo')) || 5
        };
        
        // Validar datos
        const errors = ProductosAPI.validate(productData);
        if (errors.length > 0) {
            showAlert(errors.join('<br>'), 'error');
            return;
        }
        
        // Crear producto
        const nuevoProducto = await ProductosAPI.create(productData);
        
        // Limpiar formulario
        form.reset();
        
        // Recargar lista de productos
        await loadProductsList();
        
        console.log('✅ Producto creado:', nuevoProducto);
        
    } catch (error) {
        console.error('Error al crear producto:', error);
    }
}

// =====================================================
// INICIALIZACIÓN DE INVENTARIO
// =====================================================
async function initInventario() {
    console.log('📊 Inicializando página de inventario...');
    
    try {
        // Cargar resumen de inventario
        const inventario = await InventarioAPI.getResumen();
        
        // Mostrar estadísticas
        displayInventarioStats(inventario);
        
        // Cargar productos con stock bajo si existe la sección
        if (inventario.productosConStockBajo) {
            displayProductosStockBajo(inventario.productosConStockBajo);
        }
        
        console.log('✅ Página de inventario cargada correctamente');
        
    } catch (error) {
        console.error('Error al cargar inventario:', error);
    }
}

// Función para mostrar estadísticas de inventario
function displayInventarioStats(data) {
    const container = document.getElementById('inventarioStats');
    if (!container) return;
    
    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-boxes"></i>
                </div>
                <div class="stat-info">
                    <h4>${data.totalProductos}</h4>
                    <p>Total de Productos</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon ${data.productosStockBajo > 0 ? 'warning' : 'success'}">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="stat-info">
                    <h4>${data.productosStockBajo}</h4>
                    <p>Productos con Stock Bajo</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon success">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-info">
                    <h4>${formatCurrency(data.valorTotal)}</h4>
                    <p>Valor Total del Inventario</p>
                </div>
            </div>
        </div>
    `;
}

// Función para mostrar productos con stock bajo
function displayProductosStockBajo(productos) {
    const container = document.getElementById('productosStockBajo');
    if (!container) return;
    
    if (productos.length === 0) {
        container.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                ¡Excelente! Todos los productos tienen stock suficiente.
            </div>
        `;
        return;
    }
    
    const tableHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            Los siguientes productos necesitan reposición:
        </div>
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Diferencia</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(producto => `
                        <tr>
                            <td><strong>${producto.codigo}</strong></td>
                            <td>${producto.nombre}</td>
                            <td class="text-danger">${producto.stock_actual}</td>
                            <td>${producto.stock_minimo}</td>
                            <td class="text-danger">
                                -${producto.stock_minimo - producto.stock_actual}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = tableHTML;
}

// =====================================================
// FUNCIONALIDADES GLOBALES
// =====================================================
function initGlobalFeatures() {
    // Actualizar enlaces de navegación
    updateActiveNavLink();
    
    // Inicializar tooltips si hay
    initTooltips();
    
    // Manejar errores globales de JavaScript
    window.addEventListener('error', function(e) {
        console.error('Error global capturado:', e.error);
        showAlert('Ha ocurrido un error inesperado', 'error');
    });
    
    console.log('✅ Funcionalidades globales inicializadas');
}

// Función para actualizar el enlace activo en la navegación
function updateActiveNavLink() {
    const currentPage = getCurrentPage();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        const href = link.getAttribute('href');
        if (
            (currentPage === 'index' && (href === 'index.html' || href === '/')) ||
            (currentPage === 'productos' && href.includes('productos.html')) ||
            (currentPage === 'inventario' && href.includes('inventario.html'))
        ) {
            link.classList.add('active');
        }
    });
}

// Función para inicializar tooltips (si se implementan)
function initTooltips() {
    // Placeholder para tooltips futuros
    const elementsWithTooltip = document.querySelectorAll('[data-tooltip]');
    elementsWithTooltip.forEach(element => {
        element.title = element.getAttribute('data-tooltip');
    });
}

// =====================================================
// FUNCIONES UTILITARIAS ADICIONALES
// =====================================================

// Función para refrescar datos
async function refreshData() {
    console.log('🔄 Refrescando datos...');
    showAlert('Actualizando datos...', 'info', 2000);
    
    try {
        const currentPage = getCurrentPage();
        
        switch(currentPage) {
            case 'index':
                await initDashboard();
                break;
            case 'productos':
                await loadProductsList();
                break;
            case 'inventario':
                await initInventario();
                break;
        }
        
        showAlert('Datos actualizados correctamente', 'success', 3000);
        
    } catch (error) {
        showAlert('Error al actualizar datos', 'error');
    }
}

// Función para manejar búsqueda (si se implementa)
function handleSearch(query) {
    console.log('🔍 Buscando:', query);
    // Placeholder para funcionalidad de búsqueda
    showAlert(`Buscando: "${query}"`, 'info');
}

// Función para exportar datos (placeholder)
function exportData(format = 'json') {
    showAlert(`Exportando datos en formato ${format}...`, 'info');
    // Placeholder para exportación de datos
}

// Hacer funciones disponibles globalmente para uso en HTML
window.refreshData = refreshData;
window.handleSearch = handleSearch;
window.exportData = exportData;
window.generarReporte = generarReporte;
window.verDetalle = verDetalle;

console.log('✅ JavaScript principal cargado correctamente');