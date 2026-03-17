import * as ftp from "basic-ftp";

async function checkBuildId() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html/.next");
        const list = await client.list();
        const buildId = list.find(f => f.name === "BUILD_ID");
        
        if (buildId) {
            console.log("BUILD_ID modified at:", buildId.modifiedAt);
            const fs = require('fs');
            fs.writeFileSync('last_build_id.txt', buildId.modifiedAt || "");
        } else {
            console.log("BUILD_ID not found!");
        }
    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

checkBuildId();
