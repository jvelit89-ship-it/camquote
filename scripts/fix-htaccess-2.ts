import * as ftp from "basic-ftp";
import * as fs from "fs";

async function fixHtaccess2() {
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

  # Route everything to proxy.php if it's not an existing FILE
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^(.*)$ proxy.php [L]
</IfModule>
`;
        fs.writeFileSync("clean2.htaccess", cleanHtaccess);
        await client.uploadFrom("clean2.htaccess", ".htaccess");
        console.log("Uploaded updated .htaccess pointing to proxy.php for everything including directories.");

        // Clean up checking index.php so it doesn't conflict
        if (await client.list().then(l => l.find(i => i.name === 'index.php'))) {
            await client.rename('index.php', 'backup-index.php');
            console.log('Renamed index.php to backup-index.php to prevent DirectoryIndex conflicts.');
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

fixHtaccess2();
