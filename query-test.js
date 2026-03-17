
const mysql = require('./.next/standalone/node_modules/mysql2/promise');

async function test() {
    console.log("=== INICIANDO TEST DB NODE ===");
    try {
        console.log("1. Probando socket var/lib");
        const pool1 = mysql.createPool({
            host: 'localhost',
            user: 'camquote_admin',
            password: 'JOIPSK**Tqqx',
            database: 'camquote_base',
            socketPath: '/var/lib/mysql/mysql.sock',
            connectTimeout: 5000
        });
        const [r1] = await pool1.query('SELECT 1 as res');
        console.log("SUCCESS Socket var/lib:", r1);
        pool1.end();
    } catch(e) {
        console.log("FAIL Socket var/lib:", e.message);
    }

    try {
        console.log("2. Probando TCP 127.0.0.1");
        const pool2 = mysql.createPool({
            host: '127.0.0.1',
            port: 3306,
            user: 'camquote_admin',
            password: 'JOIPSK**Tqqx',
            database: 'camquote_base',
            connectTimeout: 5000
        });
        const [r2] = await pool2.query('SELECT 1 as res');
        console.log("SUCCESS TCP 127.0.0.1:", r2);
        pool2.end();
    } catch(e) {
        console.log("FAIL TCP 127.0.0.1:", e.message);
    }
    
    // Test the raw URL parsing used by Drizzle
    try {
        console.log("3. Probando URI Drizzle (URL encoded + UNIX Socket)");
        const pool3 = mysql.createPool({
            uri: 'mysql://camquote_admin:JOIPSK%2A%2ATqqx@localhost/camquote_base?socketPath=/var/lib/mysql/mysql.sock',
            connectTimeout: 5000
        });
        const [r3] = await pool3.query('SELECT 1 as res');
        console.log("SUCCESS URI:", r3);
        pool3.end();
    } catch(e) {
        console.log("FAIL URI:", e.message);
    }

    console.log("=== FIN TEST ===");
    process.exit(0);
}

test().catch(err => {
    console.log("FATAL:", err);
    process.exit(1);
});
