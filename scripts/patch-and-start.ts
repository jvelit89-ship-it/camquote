import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";

async function patchServer() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para parchear server.js...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("Descargando server.js actual...");
        await client.downloadTo("remote-server.js", "server.js");
        
        let serverCode = fs.readFileSync("remote-server.js", "utf8");
        
        // Add polyfills at the top
        const polyfills = `
// --- NODE 16 POLYFILLS PARA NEXT.JS ---
const { fetch, Headers, Request, Response, FormData } = require('undici');
if (!globalThis.fetch) {
    globalThis.fetch = fetch;
    globalThis.Headers = Headers;
    globalThis.Request = Request;
    globalThis.Response = Response;
    globalThis.FormData = FormData;
}
// --------------------------------------
`;
        
        if (!serverCode.includes("NODE 16 POLYFILLS")) {
            serverCode = polyfills + serverCode;
            fs.writeFileSync("remote-server-patched.js", serverCode);
            
            console.log("📤 Subiendo server.js parcheado...");
            await client.uploadFrom("remote-server-patched.js", "server.js");
            console.log("✅ Parcheado correctamente.");
        } else {
            console.log("ℹ️ server.js ya estaba parcheado.");
        }

        // We also need to install undici on the remote side if it's missing, but it might be included in next.js deps.
        // To be safe we'll use a PHP script to install it via npm locally
        
        console.log("🔄 Desactivando temporalmente el Proxy...");
        try { await client.rename(".htaccess", ".htaccess.proxy"); } catch (e) { }

        const defaultHtaccess = `<IfModule mime_module>\n  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml\n</IfModule>`;
        fs.writeFileSync("htaccess_temp_patch", defaultHtaccess);
        await client.uploadFrom("htaccess_temp_patch", ".htaccess");
        fs.unlinkSync("htaccess_temp_patch");

        const installUndiciPhp = `<?php
        $dir = __DIR__;
        $nodePath = $dir . '/node_local/bin/node';
        $npmPath = $dir . '/node_local/bin/npm';

        $output = "Instalando undici as a fallback...\\n";
        $output .= shell_exec("cd $dir && $nodePath $npmPath install undici@5.28.3 --no-save 2>&1");
        
        // Kill existing node on 3000 if any
        shell_exec("kill $(lsof -t -i:3000) 2>/dev/null");
        
        $command = "cd $dir && NODE_ENV=production PORT=3000 nohup $nodePath server.js > app.log 2>&1 & echo $!";
        $pid = shell_exec($command);
        
        $output .= "\\nStarted Node.js with PID: $pid\\n";
        $output .= "Command executed: $command\\n";
        
        echo $output;
        ?>`;

        fs.writeFileSync("install-undici-start.php", installUndiciPhp);
        await client.uploadFrom("install-undici-start.php", "start.php");
        fs.unlinkSync("install-undici-start.php");

        console.log("🚀 Iniciando servidor con polyfills...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/start.php", (res: any) => {
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
        try { await client.remove("start.php"); } catch(e){}
        try {
            await client.remove(".htaccess");
            await client.rename(".htaccess.proxy", ".htaccess");
        } catch(e) {}

        fs.unlinkSync("remote-server.js");
        if(fs.existsSync("remote-server-patched.js")) fs.unlinkSync("remote-server-patched.js");

    } catch (err: any) {
        console.error("❌ FTP Error:", err.message);
    } finally {
        client.close();
    }
}

patchServer();
