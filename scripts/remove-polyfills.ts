import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function removePolyfillsAndStart() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para deshacer los polyfills de server.js...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("📤 Subiendo server.js original desde .next/standalone...");
        await client.uploadFrom(".next/standalone/server.js", "server.js");
        console.log("✅ server.js original restaurado.");
        
        console.log("🔄 Desactivando temporalmente el Proxy...");
        try { await client.rename(".htaccess", ".htaccess.proxy"); } catch (e) { }

        const defaultHtaccess = `<IfModule mime_module>\n  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml\n</IfModule>`;
        fs.writeFileSync("htaccess_temp_clean", defaultHtaccess);
        await client.uploadFrom("htaccess_temp_clean", ".htaccess");
        fs.unlinkSync("htaccess_temp_clean");

        const startCleanPhp = `<?php
        $dir = __DIR__;
        $nodePath = $dir . '/node_local/bin/node';

        // Kill existing node on 3000 if any
        shell_exec("kill $(lsof -t -i:3000) 2>/dev/null");
        
        $command = "cd $dir && NODE_ENV=production PORT=3000 nohup $nodePath server.js > app.log 2>&1 & echo $!";
        $pid = shell_exec($command);
        
        echo "Started Node.js with PID: $pid\\n";
        echo "Command executed: $command\\n";
        ?>`;

        fs.writeFileSync("start-clean.php", startCleanPhp);
        await client.uploadFrom("start-clean.php", "start-clean.php");
        fs.unlinkSync("start-clean.php");

        console.log("🚀 Iniciando servidor con Node 20 puro...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/start-clean.php", (res: any) => {
                let data = "";
                res.on("data", (chunk: any) => data += chunk);
                res.on("end", () => resolve(data));
            });
            req.on("error", reject);
            req.end();
        });

        console.log("   Resultados:");
        console.log(response);

        console.log("🧹 Restaurando Proxy original...");
        try { await client.remove("start-clean.php"); } catch(e){}
        try {
            await client.remove(".htaccess");
            await client.rename(".htaccess.proxy", ".htaccess");
        } catch(e) {}

    } catch (err: any) {
        console.error("❌ FTP Error:", err.message);
    } finally {
        client.close();
    }
}

removePolyfillsAndStart();
