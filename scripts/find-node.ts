import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function findNode() {
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
        } catch (e) { }

        const defaultHtaccess = `<IfModule mime_module>\n  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml\n</IfModule>`;
        fs.writeFileSync("htaccess_temp_find", defaultHtaccess);
        await client.uploadFrom("htaccess_temp_find", ".htaccess");
        fs.unlinkSync("htaccess_temp_find");

        console.log("📤 Subiendo script de búsqueda...");
        const findPhp = `<?php
        $output = "Buscando node en /opt/cpanel (puede tardar un poco)...\\n";
        
        $find = shell_exec('find /opt/cpanel -name "node" -type f -executable 2>/dev/null | head -n 10');
        if (!empty(trim($find))) {
            $output .= "Encontrado:\\n" . trim($find) . "\\n";
        } else {
            $output .= "No se encontró un ejecutable 'node' en /opt/cpanel.\\n";
            $output .= "Buscando en ~/.local/bin o ~/bin ...\\n";
            $find2 = shell_exec('find ~ -name "node" -type f -executable 2>/dev/null | head -n 5');
            $output .= "Encontrado en ~:\\n" . trim($find2) . "\\n";
        }
        
        echo $output;
        ?>`;

        fs.writeFileSync("find.php", findPhp);
        await client.uploadFrom("find.php", "find.php");
        fs.unlinkSync("find.php");

        console.log("🚀 Ejecutando búsqueda...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/find.php", (res) => {
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
        try { await client.remove("find.php"); } catch(e){}
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

findNode();
