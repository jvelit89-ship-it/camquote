import { execSync } from "child_process";
import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function deployFast() {
    try {
        console.log("📦 1. Preparando archivos estáticos...");
        fs.mkdirSync(".next/standalone/public", { recursive: true });
        fs.mkdirSync(".next/standalone/.next/static", { recursive: true });

        // Copy static files and env over to standalone folder
        execSync('xcopy "public" ".next\\standalone\\public" /E /I /Y');
        execSync('xcopy ".next\\static" ".next\\standalone\\.next\\static" /E /I /Y');
        if (fs.existsSync(".env")) {
            execSync('copy ".env" ".next\\standalone\\.env" /Y');
        }

        console.log("📦 2. Comprimiendo en deploy.zip (esto tardará unos segundos)...");
        if (fs.existsSync("deploy.zip")) fs.unlinkSync("deploy.zip");
        execSync('powershell Compress-Archive -Path ".next\\standalone\\*" -DestinationPath "deploy.zip" -Force');

        console.log("📤 3. Subiendo archivos por FTP...");
        const client = new ftp.Client();
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("   - Restaurando .htaccess temporal para permitir PHP...");
        const defaultHtaccess = `<IfModule mime_module>\n  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml\n</IfModule>`;
        fs.writeFileSync("htaccess_temp_def", defaultHtaccess);
        await client.uploadFrom("htaccess_temp_def", ".htaccess");
        fs.unlinkSync("htaccess_temp_def");

        console.log("   - Subiendo deploy.zip...");
        await client.uploadFrom("deploy.zip", "deploy.zip");

        console.log("   - Subiendo unzip.php...");
        const unzipPhp = `<?php
        $zip = new ZipArchive;
        $res = $zip->open('deploy.zip');
        if ($res === TRUE) {
            $zip->extractTo(__DIR__);
            $zip->close();
            echo 'OK';
        } else {
            echo 'Error extrayendo zip';
        }
        ?>`;
        fs.writeFileSync("unzip.php", unzipPhp);
        await client.uploadFrom("unzip.php", "unzip.php");
        fs.unlinkSync("unzip.php");

        console.log("🚀 4. Descomprimiendo archivos en el servidor remoto...");
        const response = await new Promise((resolve, reject) => {
            http.get("http://camquote.cc/unzip.php", (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve(data));
            }).on("error", reject);
        });
        
        if (response === 'OK') {
             console.log("   ✅ Archivos descomprimidos correctamente.");
        } else {
             console.log("   ❌ Hubo un error al descomprimir (" + response + "). Revisa cPanel.");
        }

        console.log("   - Subiendo .htaccess para Proxy...");
        const htaccess = `DirectoryIndex ""
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
</IfModule>
`;
        fs.writeFileSync("htaccess_temp", htaccess);
        await client.uploadFrom("htaccess_temp", ".htaccess");
        fs.unlinkSync("htaccess_temp");

        console.log("🧹 5. Limpiando archivos temporales en el servidor y local...");
        try { await client.remove("deploy.zip"); } catch(e){}
        try { await client.remove("unzip.php"); } catch(e){}
        fs.unlinkSync("deploy.zip");
        client.close();

        console.log("==========================================================");
        console.log("🎉 DESPLIEGUE FINALIZADO EXITOSAMENTE.");
        console.log("👉 IMPORTANTE: El código ya está en public_html.");
        console.log("Para arrancar la app, entra al Terminal SSH de cPanel y ejecuta:");
        console.log("   cd public_html");
        console.log("   NODE_ENV=production PORT=3000 nohup node server.js > app.log 2>&1 &");
        console.log("==========================================================");

    } catch (err) {
        console.error("❌ Ocurrió un error inesperado:", err);
    }
}

deployFast();
