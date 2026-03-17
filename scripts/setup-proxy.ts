import * as ftp from "basic-ftp";
import * as path from "path";
import * as fs from "fs";

async function proxyFix() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // Upload the start script
        console.log("📤 Uploading start-node.php...");
        await client.uploadFrom(path.join(process.cwd(), "scripts", "start-node.php"), "start-node.php");

        // Upload a new .htaccess configured as a reverse proxy to port 3000
        const htaccessContent = `
# php -- BEGIN cPanel-generated handler, do not edit
<IfModule mime_module>
  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml
</IfModule>
# php -- END cPanel-generated handler, do not edit

DirectoryIndex index.php index.html

RewriteEngine On
RewriteBase /

# Ignorar peticiones a archivos estáticos existentes
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Configurar el proxy inverso al puerto 3000 (donde correrá server.js)
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
`;
        fs.writeFileSync("htaccess_proxy", htaccessContent);
        console.log("📤 Uploading proxy .htaccess...");
        await client.uploadFrom("htaccess_proxy", ".htaccess");
        fs.unlinkSync("htaccess_proxy");

        console.log("✅ Proxy setup complete.");

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

proxyFix();
