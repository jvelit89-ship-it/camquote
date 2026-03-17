import * as ftp from "basic-ftp";

async function checkEnv() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        try {
            await client.downloadTo("remote_env.txt", ".env");
            console.log("✅ Downloaded .env");
        } catch(e) {
            console.log("Could not download .env", e);
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

checkEnv();
