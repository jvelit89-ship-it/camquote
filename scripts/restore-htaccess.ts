import * as ftp from "basic-ftp";

async function restoreHtaccess() {
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
            await client.rename(".htaccess_disabled", ".htaccess");
            console.log("✅ .htaccess restaurado");
        } catch(e) {
            console.log("Ya estaba restaurado.");
        }
        
    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

restoreHtaccess();
