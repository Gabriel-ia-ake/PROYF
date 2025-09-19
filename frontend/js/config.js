// =====================================================
// CONFIGURACIÓN DEL FRONTEND
// =====================================================

// URL de la API backend
const API_BASE_URL = 'http://localhost:3001';

// Endpoints de la API
const API_ENDPOINTS = {
    productos: `${API_BASE_URL}/api/productos`,
    inventario: `${API_BASE_URL}/api/inventario`,
    productoById: (id) => `${API_BASE_URL}/api/productos/${id}`
};

// Configuración global
const CONFIG = {
    // Tiempo de espera para requests (en millisegundos)
    REQUEST_TIMEOUT: 5000,
    
    // Mensajes de la aplicación
    MESSAGES: {
        LOADING: 'Cargando...',
        ERROR_NETWORK: 'Error de conexión. Verifica que el servidor esté ejecutándose.',
        ERROR_GENERIC: 'Ha ocurrido un error inesperado',
        SUCCESS_CREATE: 'Producto creado exitosamente',
        SUCCESS_UPDATE: 'Producto actualizado exitosamente',
        SUCCESS_DELETE: 'Producto eliminado exitosamente'
    },
    
    // Validaciones
    VALIDATION: {
        CODIGO_MIN_LENGTH: 3,
        CODIGO_MAX_LENGTH: 20,
        NOMBRE_MIN_LENGTH: 3,
        PRECIO_MIN: 0.01
    }
};

// Función para mostrar alertas
function showAlert(message, type = 'info', duration = 5000) {
    // Crear el elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${getAlertIcon(type)}"></i>
        ${message}
        <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
    `;
    
    // Agregar al DOM
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-eliminar después del tiempo especificado
    if (duration > 0) {
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, duration);
    }
}

// Función para obtener el icono según el tipo de alerta
function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-triangle',
        warning: 'exclamation-circle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

// Función para mostrar/ocultar loading
function toggleLoading(show = true) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Función para formatear números como moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
}

// Función para formatear fechas
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Función para validar formularios
function validateForm(formData, rules) {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
        const value = formData[field];
        
        if (rule.required && (!value || value.trim() === '')) {
            errors.push(`${rule.label} es obligatorio`);
            continue;
        }
        
        if (value && rule.minLength && value.length < rule.minLength) {
            errors.push(`${rule.label} debe tener al menos ${rule.minLength} caracteres`);
        }
        
        if (value && rule.maxLength && value.length > rule.maxLength) {
            errors.push(`${rule.label} no puede tener más de ${rule.maxLength} caracteres`);
        }
        
        if (value && rule.min && parseFloat(value) < rule.min) {
            errors.push(`${rule.label} debe ser mayor a ${rule.min}`);
        }
        
        if (value && rule.pattern && !rule.pattern.test(value)) {
            errors.push(`${rule.label} tiene un formato inválido`);
        }
    }
    
    return errors;
}

// Función para debug (solo en desarrollo)
function debug(...args) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('[DEBUG]', ...args);
    }
}

console.log('✅ Configuración cargada correctamente');
console.log('🔗 API Base URL:', API_BASE_URL);