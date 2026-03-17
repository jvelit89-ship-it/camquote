import * as ftp from "basic-ftp";
import * as fs from "fs";

async function checkPort() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const readScript = `<?php
echo "=== PS NODE ===\n";
echo shell_exec("ps aux | grep node 2>&1");

echo "\n=== NETSTAT 3000 ===\n";
echo shell_exec("netstat -tulpn | grep 3000 2>&1");
echo shell_exec("lsof -i:3000 2>&1");
?>`;
        fs.writeFileSync("check-port.php", readScript);
        await client.uploadFrom("check-port.php", "check-port.php");
        console.log("✅ check-port.php subido");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

checkPort();
