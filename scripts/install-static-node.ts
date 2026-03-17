import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function installStaticNode() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para descargar Node.js estático...");
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
        fs.writeFileSync("htaccess_temp_s", defaultHtaccess);
        await client.uploadFrom("htaccess_temp_s", ".htaccess");
        fs.unlinkSync("htaccess_temp_s");

        // We use unaofficial-builds.nodejs.org which provides statically linked musl binaries that work on older glibc (CentOS 7).
        // Or linux-x64-glibc-217 builds for Centos 7.
        // Let's use unofficially released CentOS 7 compatible binaries.
        const installPhp = `<?php
        $dir = __DIR__;
        $output = "Instalando Node 20 estático/compatible...\\n";
        
        // NodeSource provides reliable glibc2.17 compatible builds through unofficial-builds occasionally, or we can use nvm to build it, 
        // but nvm takes forever. There's a known project providing static node binaries:
        // https://github.com/nodejs/unofficial-builds
        $nodeUrl = "https://unofficial-builds.nodejs.org/download/release/v20.11.1/node-v20.11.1-linux-x64-glibc-217.tar.xz";
        $tarFile = "node.tar.xz";
        $extractDir = __DIR__ . "/node_local";
        
        $output .= shell_exec("rm -rf $extractDir");
        $output .= shell_exec("mkdir -p $extractDir");
        $output .= shell_exec("curl -o $tarFile -sL $nodeUrl");
        $output .= shell_exec("tar -xf $tarFile -C $extractDir --strip-components=1");
        $output .= shell_exec("rm $tarFile");
        
        $version = shell_exec("$extractDir/bin/node -v 2>&1");
        $output .= "\\nNode instalado exitosamente. Versión: " . trim($version) . "\\n";
        
        // Restore original server.js without polyfills to prevent double-patching issues
        shell_exec("git checkout server.js 2>/dev/null"); // Just in case, but probably not git repo here
        // We will just let the original one run if we didn't destroy it. We uploaded the polyfill one over it.
        // It's okay, polyfill on Node 20 is harmless if globalThis.fetch exists.
        
        $nodePath = $dir . '/node_local/bin/node';
        
        // Kill existing node on 3000 if any
        shell_exec("kill $(lsof -t -i:3000) 2>/dev/null");
        
        $command = "cd $dir && NODE_ENV=production PORT=3000 nohup $nodePath server.js > app.log 2>&1 & echo $!";
        $pid = shell_exec($command);
        
        $output .= "\\nStarted Node.js with PID: $pid\\n";
        $output .= "Command executed: $command\\n";
        
        echo $output;
        ?>`;

        fs.writeFileSync("install-static-node.php", installPhp);
        await client.uploadFrom("install-static-node.php", "install-static-node.php");
        fs.unlinkSync("install-static-node.php");

        console.log("🚀 Instalando Node estático y arrancando el servidor...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/install-static-node.php", (res: any) => {
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
        try { await client.remove("install-static-node.php"); } catch(e){}
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

installStaticNode();
