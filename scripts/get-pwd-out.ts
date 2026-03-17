import * as ftp from "basic-ftp";

async function getPwdOut() {
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
            await client.downloadTo("pwd-out-local.txt", "pwd-out.txt");
            console.log("✅ Descargado pwd-out.txt");
        } catch(e) {
            console.log("No se pudo descargar pwd-out.txt", e);
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

getPwdOut();
