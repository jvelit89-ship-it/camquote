import * as ftp from "basic-ftp";

async function testConnection() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });
        const rootList = await client.list();
        console.log("Root Contenido:", rootList.map(f => f.name));
        try {
            await client.cd("public_html");
            console.log("📂 Entró en public_html");
            const list = await client.list();
            if (list.some(f => f.name === "public_html")) {
                console.log("⚠️ Found nested public_html!");
                await client.cd("public_html");
                const nestedList = await client.list();
                console.log("Nested Contenido:", nestedList.map(f => f.name));
            }
        } catch (e) {
            console.log("⚠️ No se pudo entrar en public_html, intentando listado raíz...");
        }
        const list = await client.list();
        console.log("Contenido:", list.map(f => f.name));
        
        if (list.some(f => f.name === ".htaccess")) {
            console.log("📄 Reading .htaccess...");
            const tempFile = "htaccess_temp.txt";
            await client.downloadTo(tempFile, ".htaccess");
            const fs = require("fs");
            console.log("--- .htaccess START ---");
            console.log(fs.readFileSync(tempFile, "utf8"));
            console.log("--- .htaccess END ---");
        }
    } catch (err) {
        console.error("❌ Error de conexión FTP:", err);
    } finally {
        client.close();
    }
}

testConnection();
