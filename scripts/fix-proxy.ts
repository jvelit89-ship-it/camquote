import * as ftp from "basic-ftp";
import * as fs from "fs";

async function fixProxy() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // Download current proxy.php
        await client.downloadTo("remote_proxy.php", "proxy.php");
        let proxyCode = fs.readFileSync("remote_proxy.php", "utf8");
        
        // Replace localhost with 127.0.0.1
        proxyCode = proxyCode.replace(/http:\/\/localhost:3000/g, "http://127.0.0.1:3000");
        
        fs.writeFileSync("remote_proxy.php", proxyCode);
        await client.uploadFrom("remote_proxy.php", "proxy.php");
        console.log("✅ proxy.php modificado para usar 127.0.0.1");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

fixProxy();
