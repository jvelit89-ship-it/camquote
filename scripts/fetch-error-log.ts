import * as ftp from "basic-ftp";

async function fetchErrorLog() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para descargar error_log...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        try {
            await client.downloadTo("error_log_downloaded.txt", "error_log");
            const fs = require("fs");
            const lines = fs.readFileSync("error_log_downloaded.txt", "utf-8").split('\\n').slice(-50).join('\\n');
            console.log("📄 Ultimas 50 lineas del error_log:");
            console.log(lines);
        } catch(e: any) {
            console.log("No se pudo descargar error_log: " + e.message);
        }

    } catch (err: any) {
        console.error("❌ FTP Error:", err.message);
    } finally {
        client.close();
    }
}

fetchErrorLog();
