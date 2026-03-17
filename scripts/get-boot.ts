import * as ftp from "basic-ftp";
import * as fs from "fs";

async function getBoot() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        await client.downloadTo("server_boot.php", "boot.php");
        console.log(fs.readFileSync("server_boot.php", "utf8"));
    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        client.close();
    }
}
getBoot();
