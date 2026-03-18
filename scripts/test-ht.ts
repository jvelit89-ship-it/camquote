import * as ftp from 'basic-ftp';
import * as fs from 'fs';

async function restoreHtaccess() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({ host: 'ftp.camquote.cc', user: 'antigravity@camquote.cc', password: 'Related123@', secure: false });
        await client.cd('public_html');
        
        const htaccessContent = `
# php -- BEGIN cPanel-generated handler, do not edit
<IfModule mime_module>
  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml
</IfModule>
# php -- END cPanel-generated handler, do not edit

# Proxy to Node.js
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.php$ - [L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://127.0.0.1:3005/$1 [P,L]
`;
        fs.writeFileSync('fix-ht.php', `<?php file_put_contents('.htaccess', ${JSON.stringify(htaccessContent)}); echo "OK HTC"; ?>`);
        
        await client.uploadFrom('fix-ht.php', 'fix-ht.php');
        console.log('Uploaded fix-ht.php');
    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}
restoreHtaccess();
