import * as ftp from "basic-ftp";
import * as path from "path";

async function runDeleteGarbage() {
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

        console.log("📤 Uploading delete-garbage.php...");
        await client.uploadFrom(path.join(process.cwd(), "scripts", "delete-garbage.php"), "delete-garbage.php");

        console.log("👉 Now visit http://camquote.cc/delete-garbage.php to clean the server.");

    } catch (err) {
        console.error("❌ FTP Error:", err);
    } finally {
        client.close();
    }
}

runDeleteGarbage();
