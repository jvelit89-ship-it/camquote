import * as ftp from "basic-ftp";

async function getDeadlock() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        await client.downloadTo("deadlock-local.txt", "deadlock.txt");
        console.log("✅ Descargado deadlock.txt");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

getDeadlock();
