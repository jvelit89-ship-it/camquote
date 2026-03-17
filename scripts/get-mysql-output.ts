import * as ftp from "basic-ftp";
import * as fs from "fs";

async function getMysqlOutput() {
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
            await client.downloadTo("mysql-output-local.txt", "mysql-output.txt");
            console.log("✅ Downloaded mysql-output.txt");
        } catch(e) {
            console.log("Could not download mysql-output.txt", e);
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

getMysqlOutput();
