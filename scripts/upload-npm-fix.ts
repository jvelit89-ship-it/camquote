import * as ftp from "basic-ftp";
import * as path from "path";

async function uploadFix() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("📤 Uploading npm-install.php...");
        await client.uploadFrom(path.join(process.cwd(), "scripts", "npm-install.php"), "npm-install.php");

        console.log("✅ Ready! Visit http://camquote.cc/npm-install.php");

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

uploadFix();
