const fs = require('fs');
const db = require('./config/db');

async function apply() {
    try {
        const sql = fs.readFileSync('db_triggers.sql', 'utf8');
        await db.query(sql);
        console.log('Triggers applied successfully');
    } catch (e) {
        console.error('Error applying triggers:', e);
    } finally {
        process.exit(0);
    }
}
apply();
