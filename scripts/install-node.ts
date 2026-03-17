import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function installNode() {
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
        try { await client.rename(".htaccess", ".htaccess.proxy"); } catch (e) { }

        const defaultHtaccess = `<IfModule mime_module>\n  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml\n</IfModule>`;
        fs.writeFileSync("htaccess_temp_inst", defaultHtaccess);
        await client.uploadFrom("htaccess_temp_inst", ".htaccess");
        fs.unlinkSync("htaccess_temp_inst");

        console.log("📤 Subiendo script para descargar e instalar Node.js 16 (soporta GLIBC antiguos CentOS 7)...");
        const installPhp = `<?php
        $output = "Iniciando instalación local de Node.js 16...\\n";
        
        $nodeUrl = "https://nodejs.org/dist/v16.14.0/node-v16.14.0-linux-x64.tar.xz";
        $tarFile = "node.tar.xz";
        $extractDir = __DIR__ . "/node_local";
        
        $output .= shell_exec("mkdir -p $extractDir");
        $output .= shell_exec("curl -o $tarFile -sL $nodeUrl");
        $output .= shell_exec("tar -xf $tarFile -C $extractDir --strip-components=1");
        $output .= shell_exec("rm $tarFile");
        
        $version = shell_exec("$extractDir/bin/node -v");
        $output .= "\\nNode instalado exitosamente. Versión: " . trim($version) . "\\n";
        $output .= "Ruta: $extractDir/bin/node\\n";
        
        echo $output;
        ?>`;

        fs.writeFileSync("install-node.php", installPhp);
        await client.uploadFrom("install-node.php", "install-node.php");
        fs.unlinkSync("install-node.php");

        console.log("🚀 Ejecutando instalación...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/install-node.php", (res) => {
                let data = "";
                res.on("data", chunk => data += chunk);
                res.on("end", () => resolve(data));
            });
            req.on("error", reject);
            req.end();
        });

        console.log("   Resultados:");
        console.log(response);

        console.log("🧹 Restaurando Proxy original...");
        try { await client.remove("install-node.php"); } catch(e){}
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

installNode();
