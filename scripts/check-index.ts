import * as ftp from "basic-ftp";
import * as fs from "fs";

async function checkIndex() {
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
        
        const filesToCheck = ["index.php", "proxy.php", "index.html", "default.html"];
        
        for (const file of filesToCheck) {
            if (list.find(item => item.name === file)) {
                await client.downloadTo(`remote_${file}`, file);
                console.log(`\n--- ${file} content ---`);
                const content = fs.readFileSync(`remote_${file}`, "utf8");
                console.log(content.substring(0, 500) + (content.length > 500 ? "\n...[truncated]" : ""));
            } else {
                console.log(`\n--- ${file} NOT FOUND ---`);
            }
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

checkIndex();
