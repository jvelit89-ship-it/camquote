import * as ftp from "basic-ftp";
import * as fs from "fs";

async function verifyProxy() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        await client.downloadTo("remote_proxy_check.php", "proxy.php");
        console.log("✅ Downloaded proxy.php");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

verifyProxy();
