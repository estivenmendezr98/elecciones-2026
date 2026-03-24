const fs = require('fs');
const db = require('./config/db');
const path = require('path');

async function testInitFile() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../db/init.sql'), 'utf8');
        await db.query(sql);
        console.log('✅ init.sql executed successfully without syntax errors!');
    } catch (e) {
        console.error('❌ Error executing init.sql:', e);
    } finally {
        process.exit(0);
    }
}
testInitFile();
