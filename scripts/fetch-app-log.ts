import * as ftp from "basic-ftp";
import * as fs from "fs";

async function fetchAppLog() {
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
        if (list.find(item => item.name === "app.log")) {
            await client.downloadTo("app.log.remote", "app.log");
            const log = fs.readFileSync("app.log.remote", "utf8");
            const lines = log.split("\n");
            console.log("\n--- Last 50 lines of app.log ---");
            console.log(lines.slice(-50).join("\n"));
        } else {
            console.log("No app.log found in public_html");
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

fetchAppLog();
