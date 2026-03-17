import * as ftp from "basic-ftp";
import * as fs from "fs";

async function forceProxyTry2() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // Let's use `node` from the system PATH, and clean up .htaccess
        const phpProcess = `<?php
echo "<h1>Matando procesos y arrancando Proxy (V2)...</h1>";
echo "<pre>";

// Matar procesos Node existentes (suprimir errores si no hay)
shell_exec("pkill -u $(whoami) node 2>/dev/null");

// Determinar el path de node (por si acaso el global no funciona directo en nohup)
$nodePath = trim(shell_exec("which node"));
if (empty($nodePath)) {
    $nodePath = "node"; // Fallback a PATH
}
echo "Usando Node en: $nodePath\\n";

$script = <<<EOT
#!/bin/bash
export PORT=3000
export HOST=127.0.0.1
export NODE_ENV=production

export DATABASE_URL="mysql://camquote_admin:JOIPSK**Tqqx@162.241.85.85:3306/camquote_base"
export NEXT_PUBLIC_PAYPAL_CLIENT_ID="AXfz2HFvB-EJlo4xmNmAqIEUF5cmfixlrd0mcFyS-qzUSjk-i6k37GjsyzowGChUKSGuU7PKuvKTEc3r"
export PAYPAL_SECRET_KEY="EM1ys3gCsHx6gHexXueNWUPa_eCLggabo_OsC412q5bdA8jackPykT2ikGVa68Hoyhl-HW3tu6mFPZ3C"
export JWT_SECRET="quotation-system-secret-key-2026"

# Ejecutar usando la ruta de node detectada o el system node
nohup \$1 server.js > server.log 2>&1 &
echo "Started with PID \$!"
EOT;

file_put_contents('start-node-force.sh', $script);
chmod('start-node-force.sh', 0755);

// Pasar la ruta de node como argumento
$output = shell_exec("./start-node-force.sh $nodePath 2>&1");
echo $output;

sleep(3);
echo "\\n--- Server Log Tail ---\\n";
echo shell_exec("tail -n 30 server.log");

echo "\\n--- Fin ---";
echo "</pre>";
?>`;
        
        fs.writeFileSync("start-node-force.php", phpProcess);
        console.log("📤 Uploading start-node-force.php (V2)...");
        await client.uploadFrom("start-node-force.php", "start-node-force.php");
        fs.unlinkSync("start-node-force.php");

        // Simple, clean .htaccess. 
        // PassengerEnabled off could cause 500 if Passenger module isn't strictly loaded
        const htaccessContent = `
<IfModule mime_module>
  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml
</IfModule>

<IfModule mod_passenger.c>
  PassengerEnabled off
</IfModule>

DirectoryIndex index.php index.html

RewriteEngine On
RewriteBase /

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Ignore files/dirs
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Proxy to Node
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
`;
        fs.writeFileSync("htaccess_proxy_force", htaccessContent);
        console.log("📤 Uploading proxy .htaccess (V2)...");
        await client.uploadFrom("htaccess_proxy_force", ".htaccess");
        fs.unlinkSync("htaccess_proxy_force");
        
        console.log("✅ Done.");

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

forceProxyTry2();
