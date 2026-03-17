import * as ftp from "basic-ftp";
import * as fs from "fs";

async function testNodeDbSafe() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const jsCode = `
const mysql = require('./.next/standalone/node_modules/mysql2/promise');

async function test() {
    console.log("Checking URI parsing...");
    const pools = [
        "mysql://camquote_admin:JOIPSK%2A%2ATqqx@127.0.0.1:3306/camquote_base",
        "mysql://camquote_admin:JOIPSK%2A%2ATqqx@localhost/camquote_base?socketPath=/var/lib/mysql/mysql.sock",
        "mysql://camquote_admin:JOIPSK%2A%2ATqqx@localhost/camquote_base?socketPath=/tmp/mysql.sock"
    ];

    for(let uri of pools) {
        console.log("\\nTesting: " + uri);
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
`;
        fs.writeFileSync("test-ndb.js", jsCode);
        await client.uploadFrom("test-ndb.js", "test-ndb.js");

        const phpCode = `<?php
$node_path = "/home3/camquote/public_html/node_local/bin/node";
$app_dir = __DIR__;
$out = shell_exec("cd $app_dir && $node_path test-ndb.js 2>&1");
file_put_contents('ndb-out.txt', $out);
echo "DONE";
?>`;
        
        fs.writeFileSync("test-ndb.php", phpCode);
        await client.uploadFrom("test-ndb.php", "test-ndb.php");
        console.log("✅ subido test-ndb.php");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

testNodeDbSafe();
