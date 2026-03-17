import * as ftp from "basic-ftp";

async function rootFix() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const fs = require("fs");

        // 1. Create app.js (standard passenger entry point)
        const appjs = `require('./server.js');`;
        fs.writeFileSync("app_temp.js", appjs);
        await client.uploadFrom("app_temp.js", "app.js");

        // 2. Modify package.json to point to app.js instead of server.js
        const pkg = {
            name: "quotation-app",
            version: "0.1.0",
            private: true,
            main: "app.js", // CRITICAL for Passenger
            scripts: {
                start: "node app.js"
            },
            dependencies: {} // Empty to bypass npm install error
        };
        fs.writeFileSync("package_temp.json", JSON.stringify(pkg, null, 2));
        await client.uploadFrom("package_temp.json", "package.json");
        
        fs.unlinkSync("app_temp.js");
        fs.unlinkSync("package_temp.json");

        console.log("✅ Fixed! Now restart the app in cPanel.");

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

rootFix();
