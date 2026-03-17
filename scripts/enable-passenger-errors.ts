import * as ftp from "basic-ftp";
import * as fs from "fs";

async function enableFriendlyErrors() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para activar Friendly Errors en Passenger...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const htaccessContent = `<IfModule mod_passenger.c>
  PassengerNodejs /home3/camquote/public_html/node_local/bin/node
  PassengerAppType node
  PassengerStartupFile server.js
  PassengerAppRoot /home3/camquote/public_html
  PassengerAppEnv development
  PassengerFriendlyErrorPages on
</IfModule>

<IfModule mime_module>
  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml
</IfModule>
`;
        fs.writeFileSync("htaccess_friendly", htaccessContent);
        await client.uploadFrom("htaccess_friendly", ".htaccess");
        fs.unlinkSync("htaccess_friendly");
        
        console.log("✅ .htaccess subido con Friendly Errors ON.");

    } catch (err: any) {
        console.error("❌ FTP Error:", err.message);
    } finally {
        client.close();
    }
}

enableFriendlyErrors();
