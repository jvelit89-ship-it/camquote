import * as ftp from "basic-ftp";
import * as path from "path";
import * as fs from "fs";

async function setupCpanelStandlone() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("📤 Uploading Passenger-compatible server.js...");
        // A minimal wrapper that just executes the generated server.js from Next.js standalone
        // In standalone mode, the root server.js ALREADY contains the Express server.
        // CPanel might prefer it to be named 'app.js', let's supply both to be safe
        
        const appjs = `
// Passenger/cPanel Entry Point
// Requiring the Next.js standalone server
require('./server.js');
`;
        fs.writeFileSync("app_temp.js", appjs);
        await client.uploadFrom("app_temp.js", "app.js");
        fs.unlinkSync("app_temp.js");

        console.log("📤 Uploading bypassed package.json for cPanel...");
        const pkg = {
            name: "quotation-app",
            version: "0.1.0",
            private: true,
            main: "app.js", // Explicitly point to the simple wrapper
            scripts: {
                start: "node app.js"
            },
            dependencies: {} // Zero dependencies trick
        };
        fs.writeFileSync("package_temp.json", JSON.stringify(pkg, null, 2));
        await client.uploadFrom("package_temp.json", "package.json");
        fs.unlinkSync("package_temp.json");
        
        console.log("✅ Final cPanel structure uploaded.");

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

setupCpanelStandlone();
