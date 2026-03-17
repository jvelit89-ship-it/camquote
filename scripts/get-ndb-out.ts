import * as ftp from "basic-ftp";
import * as fs from "fs";

async function getNdbOut() {
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
            await client.downloadTo("ndb-out-local.txt", "ndb-out.txt");
            console.log("✅ Descargado ndb-out.txt");
        } catch(e) {
            console.log("No se pudo descargar ndb-out.txt", e);
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

getNdbOut();
