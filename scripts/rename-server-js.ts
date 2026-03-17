import * as ftp from "basic-ftp";

async function renameServerJs() {
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
        if (list.find(item => item.name === "server.js")) {
            await client.rename("server.js", "next-server.js");
            console.log("Renamed server.js to next-server.js to bypass Passenger.");
        } else {
            console.log("server.js NOT FOUND in public_html");
        }

        // Also check if there's an app.js that Passenger might pick up
        if (list.find(item => item.name === "app.js")) {
            await client.rename("app.js", "backup-app.js");
            console.log("Renamed app.js to backup-app.js to bypass Passenger.");
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

renameServerJs();
