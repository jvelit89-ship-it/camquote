import * as ftp from "basic-ftp";
import * as fs from "fs";

async function checkFtpFiles() {
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
        console.log("Files in public_html:");
        for (const item of list) {
            console.log(`- ${item.name} (${item.type})`);
        }

        // Try downloading .htaccess and index.html
        if (list.find(item => item.name === ".htaccess")) {
            await client.downloadTo(".htaccess.remote", ".htaccess");
            console.log("\n--- .htaccess content ---");
            console.log(fs.readFileSync(".htaccess.remote", "utf8"));
        }

        if (list.find(item => item.name === "index.html")) {
            await client.downloadTo("index.html.remote", "index.html");
            console.log("\n--- index.html content ---");
            console.log(fs.readFileSync("index.html.remote", "utf8"));
        }
        
        if (list.find(item => item.name === "default.html")) {
            await client.downloadTo("default.html.remote", "default.html");
            console.log("\n--- default.html content ---");
            console.log(fs.readFileSync("default.html.remote", "utf8"));
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

checkFtpFiles();
