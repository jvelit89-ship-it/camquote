import * as ftp from "basic-ftp";

async function deployNext() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        console.log("Connected to FTP");
        await client.cd("public_html");
        
        console.log("Emptying old .next folder...");
        try {
            await client.removeDir(".next");
        } catch(e) {
            console.log("Could not drop .next, probably missing or permission issue.");
        }

        console.log("Uploading .next folder (this will take a few minutes)...");
        await client.uploadFromDir(".next", ".next");
        
        console.log("Uploading package.json...");
        await client.uploadFrom("package.json", "package.json");

        console.log("✅ Done!");
    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

deployNext();
