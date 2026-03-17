import * as ftp from "basic-ftp";
import * as fs from "fs";

async function checkDeadlock() {
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
    $out = "";
    $out .= "=== PS NODE ===\n";
    $out .= shell_exec("ps aux | grep node 2>&1");
    $out .= "\n=== PS PHP ===\n";
    $out .= shell_exec("ps aux | grep php 2>&1");
    file_put_contents('deadlock.txt', $out);
    echo "OK";
?>`;
        
        fs.writeFileSync("check-deadlock.php", phpCode);
        await client.uploadFrom("check-deadlock.php", "check-deadlock.php");
        console.log("✅ subido check-deadlock.php");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

checkDeadlock();
