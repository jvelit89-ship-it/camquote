import * as ftp from "basic-ftp";

async function checkLoop() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        for(let i=0; i<30; i++) {
            await client.cd("/public_html/.next");
            const list = await client.list();
            const buildId = list.find(f => f.name === "BUILD_ID");
            
            if (buildId) {
                const modTime = buildId.modifiedAt ? buildId.modifiedAt.toISOString() : "unknown";
                console.log(`[Attempt ${i+1}] BUILD_ID modified at:`, modTime);
                if (modTime !== "2026-03-15T10:52:44.000Z" && modTime !== "unknown") {
                    console.log("Deployment finished! New BUILD_ID detected.");
                    break;
                }
            } else {
                console.log("BUILD_ID not found!");
            }
            await new Promise(r => setTimeout(r, 15000)); // wait 15s
        }
    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

checkLoop();
