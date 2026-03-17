import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function startRemoteServer() {
    const client = new ftp.Client();
    try {
        console.log("📤 Conectando por FTP...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");

        console.log("🔄 Desactivando temporalmente el Proxy...");
        try {
            await client.rename(".htaccess", ".htaccess.proxy");
        } catch (e) {
            console.log("No se pudo renombrar .htaccess (quizá no exista)");
        }

        const defaultHtaccess = `<IfModule mime_module>\n  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml\n</IfModule>`;
        fs.writeFileSync("htaccess_temp_start", defaultHtaccess);
        await client.uploadFrom("htaccess_temp_start", ".htaccess");
        fs.unlinkSync("htaccess_temp_start");

        console.log("📤 Subiendo script de inicialización start.php...");
        const startPhp = `<?php
        $dir = __DIR__;
        $nodePath = $dir . '/node_local/bin/node';

        // Kill existing node on 3000 if any
        shell_exec("kill $(lsof -t -i:3000) 2>/dev/null");
        
        $command = "cd $dir && NODE_ENV=production PORT=3000 nohup $nodePath server.js > app.log 2>&1 & echo $!";
        $pid = shell_exec($command);
        
        echo "Started Node.js with PID: $pid\\n";
        echo "Command executed: $command\\n";
        ?>`;

        fs.writeFileSync("start.php", startPhp);
        await client.uploadFrom("start.php", "start.php");
        fs.unlinkSync("start.php");

        console.log("🚀 Llamando al script desde la web para arrancar Next.js...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/start.php", (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve(data));
            });
            req.on("error", reject);
            req.end();
        });

        console.log("   Respuesta del servidor:");
        console.log(response);

        console.log("🧹 Restaurando Proxy original...");
        try {
            await client.remove("start.php");
        } catch(e){}
        try {
            await client.remove(".htaccess"); // borramos el temporal
            await client.rename(".htaccess.proxy", ".htaccess");
        } catch(e) {
            console.log("Error restaurando .htaccess");
        }
        
    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

startRemoteServer();
