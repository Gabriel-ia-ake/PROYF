// Conexión a PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'inventario_textil',
    user: 'postgres',
    password: '1234567890'  // contraseña de PostgreSQL
});

const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Conectado a PostgreSQL');
        client.release();
        return true;
    } catch (error) {
        console.error('Error conectando a PostgreSQL:', error.message);
        return false;
    }
};

const query = async (text, params) => {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (error) {
        console.error('Error en consulta:', error);
        throw error;
    }
};

module.exports = {
    pool,
    query,
    testConnection
};