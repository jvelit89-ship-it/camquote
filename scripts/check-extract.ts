import * as ftp from "basic-ftp";

async function checkExtractStatus() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("=== CHECKING .next/BUILD_ID ===");
        try {
            const list = await client.list(".next");
            const buildId = list.find(f => f.name === "BUILD_ID");
            if (buildId) {
                console.log("BUILD_ID exists, size:", buildId.size, "modified:", buildId.modifiedAt);
            } else {
                console.log("BUILD_ID not found in .next");
            }
        } catch(e) {
            console.log(".next directory not found or error:", e);
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

checkExtractStatus();
