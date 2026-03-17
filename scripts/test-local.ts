import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function testLocalHost() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para probar localhost:3000...");
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
        fs.writeFileSync("htaccess_temp_test", defaultHtaccess);
        await client.uploadFrom("htaccess_temp_test", ".htaccess");
        fs.unlinkSync("htaccess_temp_test");

        const testPhp = `<?php
        $output = "Probando http://127.0.0.1:3000/ localmente:\\n";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:3000/");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $result = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $output .= "HTTP Status: $http_code\\n";
        $output .= "Response: " . substr($result, 0, 500) . "\\n";
        
        echo $output;
        ?>`;

        fs.writeFileSync("test-local.php", testPhp);
        await client.uploadFrom("test-local.php", "test-local.php");
        fs.unlinkSync("test-local.php");

        console.log("🚀 Llamando a test-local.php...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/test-local.php", (res: any) => {
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
        try { await client.remove("test-local.php"); } catch(e){}
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

testLocalHost();
