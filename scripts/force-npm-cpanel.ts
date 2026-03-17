import * as ftp from "basic-ftp";
import * as path from "path";
import * as fs from "fs";

async function forceNpm() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("📤 Uploading force-npm.php...");
        
        const phpProcess = `<?php
echo "<h1>Forzando instalacion de dependencias (Bypass de cPanel)</h1>";
echo "<pre>";

// Comando exacto que pide cPanel
$cmd = "cd /home3/camquote/public_html && /opt/cpanel/ea-nodejs20/bin/npm install --production 2>&1";

echo "Ejecutando: $cmd\\n";
echo "Por favor espera, esto puede tomar unos minutos...\\n\\n";

// Asegurarse de tener un package.json válido mínimo si cPanel borró el nuestro
if (!file_exists('package.json') || filesize('package.json') < 10) {
    echo "Restaurando package.json minimo...\\n";
    $pkg = '{
        "name": "quotation-app",
        "version": "1.0.0",
        "dependencies": {}
    }';
    file_put_contents('package.json', $pkg);
}

// Ejecutar NPM
$output = shell_exec($cmd);
echo $output;

// Limpiar la caché de npm si hubo error
if (strpos($output, 'ERR!') !== false) {
    echo "\\n\\nBorrando cache y reintentando...\\n";
    $cmd2 = "cd /home3/camquote/public_html && rm -rf package-lock.json && /opt/cpanel/ea-nodejs20/bin/npm cache clean --force && /opt/cpanel/ea-nodejs20/bin/npm install --production 2>&1";
    echo shell_exec($cmd2);
}

echo "\\n\\n--- Fin del proceso ---";
echo "</pre>";
?>`;
        
        fs.writeFileSync("force-npm-temp.php", phpProcess);
        await client.uploadFrom("force-npm-temp.php", "force-npm.php");
        fs.unlinkSync("force-npm-temp.php");
        
        console.log("✅ force-npm.php uploaded. Ready to run via browser.");

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

forceNpm();
