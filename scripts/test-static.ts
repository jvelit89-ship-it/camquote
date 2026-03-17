import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function testStatic() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para probar static routing...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        fs.writeFileSync("test.html", "<h1>Hello from static test</h1>");
        await client.uploadFrom("test.html", "test.html");
        fs.unlinkSync("test.html");
        
        console.log("🚀 Llamando a test.html...");
        const response = await new Promise<string>((resolve, reject) => {
            const req = http.get("http://camquote.cc/test.html", (res: any) => {
                let data = "";
                res.on("data", (chunk: any) => data += chunk);
                res.on("end", () => resolve(`HTTP ${res.statusCode}\\n${data}`));
            });
            req.on("error", reject);
            req.end();
        });

        console.log("   Resultados:");
        console.log(response);

        try { await client.remove("test.html"); } catch(e){}

    } catch (err: any) {
        console.error("❌ FTP Error:", err.message);
    } finally {
        client.close();
    }
}

testStatic();
