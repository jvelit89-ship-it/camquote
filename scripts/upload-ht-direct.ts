import * as ftp from 'basic-ftp';
import * as fs from 'fs';

async function restoreHtaccessDirect() {
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
        fs.writeFileSync('.htaccess-fixed', htaccessContent);
        
        await client.uploadFrom('.htaccess-fixed', '.htaccess');
        console.log('✅ Uploaded .htaccess directly!');
    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}
restoreHtaccessDirect();
