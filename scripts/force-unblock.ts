import * as ftp from "basic-ftp";

async function forceUnblock() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // Rename .htaccess temporarily to kill all proxy routing
        try {
            await client.rename(".htaccess", ".htaccess_disabled");
            console.log("✅ .htaccess deshabilitado temporalmente");
        } catch(e) {
            console.log("Ya estaba deshabilitado o no existe.");
        }
        
    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

forceUnblock();
