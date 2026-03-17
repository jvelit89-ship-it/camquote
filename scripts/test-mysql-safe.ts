import * as ftp from "basic-ftp";
import * as fs from "fs";

async function testMysqlSafe() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const phpCode = `<?php
$node_path = "/home3/camquote/public_html/node_local/bin/node";
shell_exec("$node_path test-mysql.js > mysql-output.txt 2>&1");
echo "OK";
?>`;
        
        fs.writeFileSync("refresh_cache.php", phpCode);
        await client.uploadFrom("refresh_cache.php", "refresh_cache.php");
        console.log("✅ subido refresh_cache.php");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

testMysqlSafe();
