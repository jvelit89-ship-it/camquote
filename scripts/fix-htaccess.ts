import * as ftp from "basic-ftp";
import * as fs from "fs";

async function fixHtaccess() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const cleanHtaccess = `
<IfModule mod_rewrite.c>
  RewriteEngine On
  # Force HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Route everything else to proxy.php
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)$ proxy.php [L]
</IfModule>
`;
        fs.writeFileSync("clean.htaccess", cleanHtaccess);
        await client.uploadFrom("clean.htaccess", ".htaccess");
        console.log("Uploaded new clean .htaccess pointing to proxy.php");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

fixHtaccess();
