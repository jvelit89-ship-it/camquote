import * as ftp from "basic-ftp";
import * as path from "path";
import * as fs from "fs";

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        console.log("🚀 Connected to FTP");

        // Navigate to public_html
        await client.cd("public_html");
        
        const list = await client.list();
        if (list.some(f => f.name === "public_html")) {
            await client.cd("public_html");
        }

        console.log("📂 Current directory:", await client.pwd());

        // 1. Upload unzip.php
        console.log("📤 Uploading unzip.php...");
        await client.uploadFrom(path.join(process.cwd(), "scripts", "unzip.php"), "unzip.php");

        // 2. Upload deploy.zip
        console.log("📤 Uploading deploy.zip (this may take a minute)...");
        await client.uploadFrom(path.join(process.cwd(), "deploy.zip"), "deploy.zip");

        // 3. Prevent overwriting .htaccess because it's configured for proxy.php 3001

        console.log("✅ Files uploaded!");
        console.log("👉 Now you need to visit http://camquote.cc/unzip.php to extract the files.");

    } catch (err) {
        console.error("❌ Error during deployment:", err);
    } finally {
        client.close();
    }
}

deploy();
