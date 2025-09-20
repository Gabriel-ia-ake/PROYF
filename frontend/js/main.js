document.addEventListener('DOMContentLoaded', function() {
    console.log('Sistema de Inventario Textil iniciado');
    initApp();
});

async function initApp() {
    try {
        const currentPage = getCurrentPage();
        console.log('📄 Página actual:', currentPage);
        
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
                console.log('Página no reconocida');
        }
        
        initGlobalFeatures();
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error. Verifica que el servidor esté ejecutándose.', 'error');
    }
}

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

async function initDashboard() {
    console.log('🏠 Inicializando dashboard...');
    
    try {
        const statsData = await InventarioAPI.getResumen();
        updateDashboardStats(statsData);
        
        console.log('✅ Dashboard cargado correctamente');
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        
        updateDashboardStats({
            totalProductos: 'Error',
            productosStockBajo: 'Error',
            valorTotal: 'Error'
        });
    }
}

async function initProductos() {
    console.log('📦 Inicializando página de productos...');
    
    try {
        await loadProductsList();
        
        initProductForm();
        
        console.log('Página de productos cargada');
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

async function loadProductsList() {
    try {
        const productos = await ProductosAPI.getAll();
        populateProductsTable(productos, 'productosTableContainer');
        
        const contador = document.getElementById('productosCount');
        if (contador) {
            contador.textContent = productos.length;
        }
        
    } catch (error) {
        console.error('Error al cargar lista de productos:', error);
        
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

function initProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    
    console.log('Inicializando formulario de productos');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleProductSubmit(form);
    });
    
    const codigoInput = form.querySelector('#codigo');
    if (codigoInput) {
        codigoInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

async function handleProductSubmit(form) {
    try {
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
        
        const errors = ProductosAPI.validate(productData);
        if (errors.length > 0) {
            showAlert(errors.join('<br>'), 'error');
            return;
        }
        
        const nuevoProducto = await ProductosAPI.create(productData);
        form.reset();
        await loadProductsList();
        
        console.log('Producto creado:', nuevoProducto);
        
    } catch (error) {
        console.error('Error al crear producto:', error);
    }
}


async function initInventario() {
    console.log('Inicializando página de inventario');
    
    try {
        const inventario = await InventarioAPI.getResumen();
        displayInventarioStats(inventario);
        if (inventario.productosConStockBajo) {
            displayProductosStockBajo(inventario.productosConStockBajo);
        }
        
        console.log('Página de inventario cargada');
        
    } catch (error) {
        console.error('Error al cargar inventario:', error);
    }
}

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

function initGlobalFeatures() {
    updateActiveNavLink();
    initTooltips();
    window.addEventListener('error', function(e) {
        console.error('Error global capturado:', e.error);
        showAlert('Ha ocurrido un error inesperado', 'error');
    });
    
    console.log('Funcionalidades globales inicializadas');
}

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

function initTooltips() {
    const elementsWithTooltip = document.querySelectorAll('[data-tooltip]');
    elementsWithTooltip.forEach(element => {
        element.title = element.getAttribute('data-tooltip');
    });
}

async function refreshData() {
    console.log('Refrescando datos');
    showAlert('Actualizando datos', 'info', 2000);
    
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

function handleSearch(query) {
    console.log('Buscando:', query);
    showAlert(`Buscando: "${query}"`, 'info');
}

function exportData(format = 'json') {
    showAlert(`Exportando datos en formato ${format}...`, 'info');
}

window.refreshData = refreshData;
window.handleSearch = handleSearch;
window.exportData = exportData;
window.generarReporte = generarReporte;
window.verDetalle = verDetalle;

console.log('JavaScript principal cargado');