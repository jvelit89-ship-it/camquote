import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function configurePassenger() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para configurar Passenger...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // Let's create an .htaccess that attempts to hijack Passenger settings.
        const htaccessContent = `<IfModule mod_passenger.c>
  PassengerNodejs /home3/camquote/public_html/node_local/bin/node
  PassengerAppType node
  PassengerStartupFile server.js
  PassengerAppRoot /home3/camquote/public_html
</IfModule>

<IfModule mime_module>
  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml
</IfModule>
`;
        fs.writeFileSync("htaccess_temp_pass", htaccessContent);
        await client.uploadFrom("htaccess_temp_pass", ".htaccess");
        fs.unlinkSync("htaccess_temp_pass");
        
        console.log("✅ .htaccess subido con configuración de Passenger.");

        // Kill any existing node we started manually so they don't fight over port (port is handled by passenger usually via socket or env PORT)
        const killScript = `<?php shell_exec("kill -9 $(lsof -t -i:3000) 2>/dev/null; pkill -f 'node server.js'"); echo "Killed"; ?>`;
        fs.writeFileSync("kill.php", killScript);
        await client.uploadFrom("kill.php", "kill.php");
        fs.unlinkSync("kill.php");
        
        await new Promise((r) => {
            http.get("http://camquote.cc/kill.php", () => r(true)).on("error", () => r(false));
        });
        
        await client.remove("kill.php");

    } catch (err: any) {
        console.error("❌ FTP Error:", err.message);
    } finally {
        client.close();
    }
}

configurePassenger();
