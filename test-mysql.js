
const mysql = require('./.next/standalone/node_modules/mysql2/promise');

async function test() {
    console.log("Starting MySQL connection test...");
    try {
        const pool = mysql.createPool('mysql://camquote_admin:JOIPSK**Tqqx@localhost/camquote_base?socketPath=/var/lib/mysql/mysql.sock');
        console.log("Pool created. Executing query...");
        const [rows] = await pool.query("SELECT 1 as res");
        console.log("SUCCESS:", rows);
        process.exit(0);
    } catch(e) {
        console.error("FAILED connection socket:", e);
    }
    
    try {
        const pool2 = mysql.createPool('mysql://camquote_admin:JOIPSK**Tqqx@127.0.0.1:3306/camquote_base');
        console.log("Pool 2 created (127.0.0.1). Executing query...");
        const [rows2] = await pool2.query("SELECT 1 as res");
        console.log("SUCCESS 127.0.0.1:", rows2);
        process.exit(0);
    } catch(e) {
        console.error("FAILED connection 127.0.0.1:", e);
        process.exit(1);
    }
}
test();
