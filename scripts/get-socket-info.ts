import * as ftp from "basic-ftp";
import * as fs from "fs";

async function getSocketInfo() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        try {
            await client.downloadTo("socket-info-local.txt", "socket-info.txt");
            console.log("✅ Descargado socket-info.txt");
        } catch(e) {
            console.log("No se pudo descargar socket-info.txt", e);
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

getSocketInfo();
