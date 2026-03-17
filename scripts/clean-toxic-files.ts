import * as ftp from "basic-ftp";
import * as path from "path";
import * as fs from "fs";

async function cleanAndReset() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        console.log("🧹 Borrando configuraciones problemáticas...");
        
        const filesToDelete = [
            ".htaccess", 
            "start-node-force.php", 
            "start-node.php", 
            "start-node-force.sh",
            "start-server.sh",
            "server.log"
        ];
        
        for (const file of filesToDelete) {
            try {
                await client.remove(file);
                console.log(`  - Borrado ${file}`);
            } catch (e) {
                // Ignore if not exists
            }
        }

        console.log("📤 Subiendo .htaccess por defecto de cPanel...");
        const defaultHtaccess = `
# Default cPanel htaccess
<IfModule mime_module>
  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml
</IfModule>
`;
        fs.writeFileSync("htaccess_temp", defaultHtaccess);
        await client.uploadFrom("htaccess_temp", ".htaccess");
        fs.unlinkSync("htaccess_temp");

        console.log("✅ Limpieza completada. El dominio ahora debería mostrar el índice vacío o 403 (comportamiento normal sin app).");

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

cleanAndReset();
