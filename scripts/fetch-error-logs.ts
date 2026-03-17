import * as ftp from "basic-ftp";
import * as fs from "fs";

async function fetchErrorLogs() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        console.log("Connected to FTP.");

        // Check public_html/error_log
        await client.cd("public_html");
        const list = await client.list();
        
        if (list.find(item => item.name === "error_log")) {
            await client.downloadTo("error_log.remote", "error_log");
            console.log("\n--- public_html/error_log ---");
            const log = fs.readFileSync("error_log.remote", "utf8");
            const lines = log.split("\n");
            console.log(lines.slice(-30).join("\n"));
        } else {
            console.log("No error_log found in public_html");
        }

        // Check parent directory logs/
        try {
            await client.cd("../logs");
            const logsList = await client.list();
            for (const file of logsList) {
                if (file.name.includes("-error_log") || file.name.includes("error")) {
                    await client.downloadTo(`log_${file.name}`, file.name);
                    console.log(`\n--- logs/${file.name} ---`);
                    const log = fs.readFileSync(`log_${file.name}`, "utf8");
                    const lines = log.split("\n");
                    console.log(lines.slice(-30).join("\n"));
                }
            }
        } catch(e: any) {
            console.log("Could not access ../logs: " + e.message);
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

fetchErrorLogs();
