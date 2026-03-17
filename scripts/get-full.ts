import * as ftp from "basic-ftp";
import * as fs from "fs";

async function getFullLog() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        await client.downloadTo("app_full.log", "app.log");
        console.log("✅ Downloaded full app.log", fs.statSync("app_full.log").size, "bytes");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

getFullLog();
