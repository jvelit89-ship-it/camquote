import * as ftp from "basic-ftp";
import * as fs from "fs";

async function testMysqlNode() {
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
`;
        fs.writeFileSync("test-mysql.js", jsCode);
        await client.uploadFrom("test-mysql.js", "test-mysql.js");

        const phpCode = `<?php
$node_path = "/home3/camquote/public_html/node_local/bin/node";
$out = shell_exec("$node_path test-mysql.js 2>&1");
echo "OUTPUT:\n$out\n";
?>`;
        
        fs.writeFileSync("test-ms.php", phpCode);
        await client.uploadFrom("test-ms.php", "test-ms.php");
        console.log("✅ subido test-ms.php");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

testMysqlNode();
