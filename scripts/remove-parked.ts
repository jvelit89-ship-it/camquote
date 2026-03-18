import * as ftp from 'basic-ftp';
import * as fs from 'fs';

async function removeParked() {
    const client = new ftp.Client();
    try {
        await client.access({ host: 'ftp.camquote.cc', user: 'antigravity@camquote.cc', password: 'Related123@', secure: false });
        await client.cd('public_html');
        
        // Rename index files if they exist
        try { await client.rename('index.php', 'index.php.bak'); } catch(e) {}
        try { await client.rename('index.html', 'index.html.bak'); } catch(e) {}
        try { await client.rename('default.html', 'default.html.bak'); } catch(e) {}

        const htaccessContent = `
# php -- BEGIN cPanel-generated handler, do not edit
<IfModule mime_module>
  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml
</IfModule>
# php -- END cPanel-generated handler, do not edit

DirectoryIndex proxy.php

# Proxy to Node.js via proxy.php
RewriteEngine On
RewriteBase /

# Si el archivo NO existe físicamente, proxy.php se encarga
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ proxy.php [L]
`;
        fs.writeFileSync('.htaccess-fixed2', htaccessContent);
        await client.uploadFrom('.htaccess-fixed2', '.htaccess');
        console.log('✅ Removed parked indexes and updated .htaccess!');
    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}
removeParked();
