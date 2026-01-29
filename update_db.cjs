// update_db.js
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necesario para conexiones seguras a Supabase
  }
});

async function runMigration() {
  try {
    await client.connect();
    console.log("🔌 Conectado a la base de datos...");

    // El comando SQL para crear la columna
    const query = `
      ALTER TABLE videos 
      ADD COLUMN IF NOT EXISTS channel_subscribers int8;
    `;

    await client.query(query);
    console.log("✅ ¡ÉXITO! Columna 'channel_subscribers' creada correctamente.");

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.end();
    console.log("🔒 Conexión cerrada.");
  }
}

runMigration();