import * as ftp from "basic-ftp";

async function checkFtp() {
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
        const nextFolder = list.find(l => l.name === ".next");
        if (nextFolder) {
            console.log(".next exists, last modified:", nextFolder.modifiedAt);
        } else {
            console.log(".next DOES NOT EXIST");
        }
    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

checkFtp();
