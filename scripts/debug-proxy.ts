import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function runCliTest() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para depurar proxy.php...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const testCliPhp = `<?php
        $output = shell_exec("php proxy.php 2>&1");
        echo "CLI proxy.php test output:\\n";
        echo $output;
        ?>`;

        fs.writeFileSync("test-cli.php", testCliPhp);
        await client.uploadFrom("test-cli.php", "test-cli.php");
        fs.unlinkSync("test-cli.php");

        console.log("🚀 Llamando a test-cli.php...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/test-cli.php", (res: any) => {
                let data = "";
                res.on("data", (chunk: any) => data += chunk);
                res.on("end", () => resolve(data));
            });
            req.on("error", reject);
            req.end();
        });

        console.log("   Resultados:");
        console.log(response);

        try { await client.remove("test-cli.php"); } catch(e){}

    } catch (err: any) {
        console.error("❌ FTP Error:", err.message);
    } finally {
        client.close();
    }
}

runCliTest();
