import * as ftp from "basic-ftp";
import * as fs from "fs";

async function run() {
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
echo "=== PUBLIC HTML ===\\n";
echo shell_exec("ls -la 2>&1");

echo "\\n=== NEXT DIR ===\\n";
echo shell_exec("ls -la .next 2>&1");
?>`;
        fs.writeFileSync("list-files.php", readScript);
        await client.uploadFrom("list-files.php", "list-files.php");
        console.log("✅ list-files.php subido");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}
run();
