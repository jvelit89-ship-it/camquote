import * as ftp from "basic-ftp";
import * as fs from "fs";

async function uploadZip() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("Subiendo deploy.zip...");
        await client.uploadFrom("deploy_out/deploy.zip", "deploy.zip");
        console.log("✅ deploy.zip subido");
        
        console.log("Subiendo unzip.php...");
        await client.uploadFrom("deploy_out/unzip.php", "unzip.php");
        console.log("✅ unzip.php subido");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

uploadZip();
