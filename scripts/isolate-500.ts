import * as ftp from "basic-ftp";
import * as http from "http";
import * as fs from "fs";

async function isolateError() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para aislar el error 500...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("🔄 Renombrando .htaccess...");
        try { await client.rename(".htaccess", ".htaccess.broken"); } catch (e) { }

        const simplePhp = `<?php echo "Hello World - PHP is working!"; ?>`;
        fs.writeFileSync("test-hello.php", simplePhp);
        await client.uploadFrom("test-hello.php", "test-hello.php");
        fs.unlinkSync("test-hello.php");

        console.log("🚀 Llamando a test-hello.php sin .htaccess...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/test-hello.php", (res: any) => {
                let data = "";
                res.on("data", (chunk: any) => data += chunk);
                res.on("end", () => resolve(`Status: ${res.statusCode}\\nResponse: ${data.substring(0,200)}`));
            });
            req.on("error", reject);
            req.end();
        });

        console.log("   Resultados:");
        console.log(response);

        try { await client.remove("test-hello.php"); } catch(e){}

    } catch (err: any) {
        console.error("❌ FTP Error:", err.message);
    } finally {
        client.close();
    }
}

isolateError();
