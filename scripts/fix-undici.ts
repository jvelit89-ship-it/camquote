import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";

async function fixUndiciAndStart() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para arreglar dependencias...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("🔄 Desactivando temporalmente el Proxy...");
        try { await client.rename(".htaccess", ".htaccess.proxy"); } catch (e) { }

        const defaultHtaccess = `<IfModule mime_module>\n  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml\n</IfModule>`;
        fs.writeFileSync("htaccess_temp_u", defaultHtaccess);
        await client.uploadFrom("htaccess_temp_u", ".htaccess");
        fs.unlinkSync("htaccess_temp_u");

        const installPhp = `<?php
        $dir = __DIR__;
        // The issue is that npm install --no-save without a package.json in public_html might install it somewhere else or fail quietly.
        // Also the node_modules is inside standalone but we run it from public_html.
        
        $output = "Instalando undici y sus dependencias explícitamente en el directorio local mediante npm...\\n";
        
        $nodePath = $dir . '/node_local/bin/node';
        $npmPath = $dir . '/node_local/bin/npm';
        
        // Ensure node_modules exists
        @mkdir($dir . '/node_modules', 0755, true);
        
        // We will do a full npm install in a tmp dir, then copy the result
        $output .= shell_exec("cd $dir && mkdir -p tmp_install && cd tmp_install && $nodePath $npmPath init -y && $nodePath $npmPath install undici@5.28.4");
        $output .= shell_exec("cd $dir && cp -r tmp_install/node_modules/* node_modules/ && rm -rf tmp_install");
        
        // Kill existing node on 3000 if any
        shell_exec("kill $(lsof -t -i:3000) 2>/dev/null");
        
        $command = "cd $dir && NODE_ENV=production PORT=3000 nohup $nodePath server.js > app.log 2>&1 & echo $!";
        $pid = shell_exec($command);
        
        $output .= "\\nStarted Node.js with PID: $pid\\n";
        $output .= "Command executed: $command\\n";
        
        echo $output;
        ?>`;

        fs.writeFileSync("fix-undici.php", installPhp);
        await client.uploadFrom("fix-undici.php", "fix-undici.php");
        fs.unlinkSync("fix-undici.php");

        console.log("🚀 Instalando undici y arrancando el servidor...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/fix-undici.php", (res: any) => {
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
        try { await client.remove("fix-undici.php"); } catch(e){}
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

fixUndiciAndStart();
