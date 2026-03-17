import * as ftp from "basic-ftp";

async function checkServerLogs() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const list = await client.list();
        
        const errorLog = list.find(f => f.name === "error_log");
        if (errorLog) {
            console.log("📥 Downloading error_log...");
            await client.downloadTo("error_log_local.txt", "error_log");
            const fs = require("fs");
            console.log("--- error_log (last 1000 chars) ---");
            const content = fs.readFileSync("error_log_local.txt", "utf8");
            console.log(content.slice(-1000));
        } else {
            console.log("⚠️ No error_log found in public_html");
        }

        const serverLog = list.find(f => f.name === "server.log");
        if (serverLog) {
            console.log("📥 Downloading server.log...");
            await client.downloadTo("server_log_local.txt", "server.log");
            const fs = require("fs");
            console.log("--- server.log (last 1000 chars) ---");
            const content = fs.readFileSync("server_log_local.txt", "utf8");
            console.log(content.slice(-1000));
        } else {
            console.log("⚠️ No server.log found in public_html");
        }

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

checkServerLogs();
