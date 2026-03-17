import * as ftp from "basic-ftp";
import * as fs from "fs";

async function fetchLog() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para descargar app.log...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        await client.downloadTo("remote-app.log", "app.log");
        
        console.log("📄 Contenido de app.log:");
        console.log(fs.readFileSync("remote-app.log", "utf8"));

    } catch (err: any) {
        console.error("❌ FTP Error (¿Quizás app.log no existe?):", err.message);
    } finally {
        client.close();
    }
}

fetchLog();
