import * as ftp from "basic-ftp";
import * as fs from "fs";

async function getLogs() {
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
        for (const item of list) {
            if (item.name.endsWith(".log") || item.name === "proxy.php" || item.name === "start-proxy.php") {
                console.log(`Downloading ${item.name}...`);
                await client.downloadTo(`server_${item.name}`, item.name);
                console.log(`\n--- ${item.name} content ---`);
                const content = fs.readFileSync(`server_${item.name}`, "utf8");
                console.log(content.slice(-2000)); // print last 2000 chars
            }
        }
    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

getLogs();
