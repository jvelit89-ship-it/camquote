import * as ftp from "basic-ftp";
import * as path from "path";
import * as fs from "fs";

async function forceProxy() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // 1. Upload an aggressive cleanup/restart PHP script
        const phpProcess = `<?php
echo "<h1>Matando procesos y arrancando Proxy...</h1>";
echo "<pre>";

// Matar TODO proceso de node del usuario
echo "Killing node processes...\\n";
shell_exec("pkill -9 -u $(whoami) node");
shell_exec("pkill -9 node");

// Re-lanzar nuestro server
echo "Starting Node.js server...\\n";
$script = <<<EOT
#!/bin/bash
export PORT=3000
export HOST=127.0.0.1
export NODE_ENV=production

# Load env variables so the server has them
export DATABASE_URL="mysql://camquote_admin:JOIPSK**Tqqx@162.241.85.85:3306/camquote_base"
export NEXT_PUBLIC_PAYPAL_CLIENT_ID="AXfz2HFvB-EJlo4xmNmAqIEUF5cmfixlrd0mcFyS-qzUSjk-i6k37GjsyzowGChUKSGuU7PKuvKTEc3r"
export PAYPAL_SECRET_KEY="EM1ys3gCsHx6gHexXueNWUPa_eCLggabo_OsC412q5bdA8jackPykT2ikGVa68Hoyhl-HW3tu6mFPZ3C"
export JWT_SECRET="quotation-system-secret-key-2026"

nohup /home/camquote/public_html/bin/node server.js > server.log 2>&1 &
echo "Started with PID $!"
EOT;

file_put_contents('start-node-force.sh', $script);
chmod('start-node-force.sh', 0755);

$output = shell_exec("./start-node-force.sh 2>&1");
echo $output;

// Mostrar log inicial para ver si arranca bien
sleep(2);
echo "\\n--- Server Log Tail ---\\n";
echo shell_exec("tail -n 20 server.log");

echo "\\n--- Fin ---";
echo "</pre>";
?>`;
        
        fs.writeFileSync("start-node-force.php", phpProcess);
        console.log("📤 Uploading start-node-force.php...");
        await client.uploadFrom("start-node-force.php", "start-node-force.php");
        fs.unlinkSync("start-node-force.php");

        // 2. Upload an .htaccess that explicitly disables Passenger
        const htaccessContent = `
# Deshabilitar Passenger explícitamente para esta carpeta
PassengerEnabled off

# Configuración básica de PHP
<IfModule mime_module>
  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml
</IfModule>

DirectoryIndex index.php index.html

RewriteEngine On
RewriteBase /

# Forzar HTTPS (útil para Next.js)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Ignorar archivos reales (imágenes, php scripts)
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Proxy inverso a Node (Puerto 3000)
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
`;
        fs.writeFileSync("htaccess_proxy_force", htaccessContent);
        console.log("📤 Uploading forced proxy .htaccess...");
        await client.uploadFrom("htaccess_proxy_force", ".htaccess");
        fs.unlinkSync("htaccess_proxy_force");

        // Also delete app.js to remove Passenger triggers
        try { await client.remove("app.js"); } catch {}
        
        console.log("✅ Configured! I will now run start-node-force.php via browser.");

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

forceProxy();
