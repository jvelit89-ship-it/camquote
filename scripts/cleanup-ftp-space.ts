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
        
        console.log("Removing large files...");
        try { await client.remove("deploy.zip"); console.log("Deleted deploy.zip"); } catch (e) {}
        try { await client.remove("app.log"); console.log("Deleted app.log"); } catch (e) {}
        try { await client.remove("error_log"); console.log("Deleted error_log"); } catch (e) {}
        
    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        client.close();
    }
}

cleanup();
