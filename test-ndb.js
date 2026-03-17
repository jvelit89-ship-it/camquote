
const mysql = require('./.next/standalone/node_modules/mysql2/promise');

async function test() {
    console.log("Checking URI parsing...");
    const pools = [
        "mysql://camquote_admin:JOIPSK%2A%2ATqqx@127.0.0.1:3306/camquote_base",
        "mysql://camquote_admin:JOIPSK%2A%2ATqqx@localhost/camquote_base?socketPath=/var/lib/mysql/mysql.sock",
        "mysql://camquote_admin:JOIPSK%2A%2ATqqx@localhost/camquote_base?socketPath=/tmp/mysql.sock"
    ];

    for(let uri of pools) {
        console.log("\nTesting: " + uri);
        try {
            const pool = mysql.createPool({uri, connectTimeout: 3000});
            const [rows] = await pool.query("SELECT 1 as res");
            console.log("-> SUCCESS:", rows);
            await pool.end();
        } catch(e) {
            console.error("-> FAILED:", e.message || e.code);
        }
    }
}
test().catch(console.error);
