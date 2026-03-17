import * as ftp from "basic-ftp";

async function uploadCli() {
    const client = new ftp.Client();
    try {
        console.log("Conectando FTP...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        await client.uploadFrom("cli-start.php", "cli-start.php");
        console.log("✅ cli-start.php subido.");

    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        client.close();
    }
}

uploadCli();
