import * as ftp from "basic-ftp";
import * as fs from "fs";

async function doFtpTasks() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("=== CHECKING FILES ===");
        const list = await client.list();
        const zipFile = list.find(f => f.name === "deploy.zip");
        if (zipFile) {
            console.log("deploy.zip size:", zipFile.size, "modified:", zipFile.modifiedAt);
            // Delete it to free space
            await client.remove("deploy.zip");
            console.log("Deleted deploy.zip");
        }
        
        // try to download BUILD_ID
        try {
            await client.downloadTo("remote_BUILD_ID.txt", ".next/BUILD_ID");
            const cnt = fs.readFileSync("remote_BUILD_ID.txt", "utf-8");
            console.log("BUILD_ID contents:", cnt);
        } catch(e) {
            console.log("Could not download BUILD_ID", e);
        }
        
    } catch (err: any) {
        console.error("FTP Error:", err.message);
    } finally {
        client.close();
    }
}

doFtpTasks();
