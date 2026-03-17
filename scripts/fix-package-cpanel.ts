import * as ftp from "basic-ftp";

async function run() {
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
        if (list.some(f => f.name === "public_html")) {
            await client.cd("public_html");
        }

        console.log("📤 Downloading package.json to modify...");
        await client.downloadTo("package_temp.json", "package.json");

        const fs = require("fs");
        const pkg = JSON.parse(fs.readFileSync("package_temp.json", "utf8"));
        
        // Remove dependencies to trick cPanel into skipping npm install
        pkg.dependencies = {};
        pkg.devDependencies = {};
        
        fs.writeFileSync("package_temp.json", JSON.stringify(pkg, null, 2));

        console.log("📤 Uploading modified package.json...");
        await client.uploadFrom("package_temp.json", "package.json");
        
        // upload a blank package-lock as well, just in case
        fs.writeFileSync("package-lock_temp.json", JSON.stringify({
            name: "quotation-app",
            version: "0.1.0",
            lockfileVersion: 3,
            packages: { "": {} }
        }, null, 2));
        await client.uploadFrom("package-lock_temp.json", "package-lock.json");

        fs.unlinkSync("package_temp.json");
        fs.unlinkSync("package-lock_temp.json");

        console.log("✅ Ready! Now go back to cPanel Application Manager and click 'Deploy' again or 'Ensure dependencies'.");

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

run();
