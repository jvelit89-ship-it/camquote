import * as ftp from "basic-ftp";

async function cleanup() {
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

        console.log("📂 Current directory:", await client.pwd());

        // Delete unzip.php and deploy.zip
        console.log("🗑 Deleting deployment files...");
        try { await client.remove("unzip.php"); } catch {}
        try { await client.remove("deploy.zip"); } catch {}
        
        // List files to see what's there
        const files = await client.list();
        console.log("📄 Remaining files:", files.map(f => f.name));

    } catch (err) {
        console.error("❌ Cleanup error:", err);
    } finally {
        client.close();
    }
}

cleanup();
