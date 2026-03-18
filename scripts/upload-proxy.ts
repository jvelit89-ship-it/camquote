import * as ftp from 'basic-ftp';
import * as fs from 'fs';

async function uploadProxy() {
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

# Proxy to Node.js via proxy.php
RewriteEngine On
RewriteBase /
RewriteRule ^index\\.php$ - [L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ proxy.php [L]
`;
        fs.writeFileSync('.htaccess-proxy', htaccessContent);
        
        await client.uploadFrom('deploy_out/proxy.php', 'proxy.php');
        console.log('✅ Uploaded proxy.php!');
        
        await client.uploadFrom('.htaccess-proxy', '.htaccess');
        console.log('✅ Uploaded .htaccess proxy rules!');
        
    } catch (e) {
        console.error(e);
    } finally {
        client.close();
    }
}
uploadProxy();
