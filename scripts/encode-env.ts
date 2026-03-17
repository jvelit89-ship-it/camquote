import * as ftp from "basic-ftp";

async function encodeEnvPassword() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        let newEnv = `DATABASE_URL="mysql://camquote_admin:JOIPSK%2A%2ATqqx@127.0.0.1:3306/camquote_base"\n`;
        newEnv += `NEXT_PUBLIC_PAYPAL_CLIENT_ID="AXfz2HFvB-EJlo4xmNmAqIEUF5cmfixlrd0mcFyS-qzUSjk-i6k37GjsyzowGChUKSGuU7PKuvKTEc3r"\n`;
        newEnv += `PAYPAL_SECRET_KEY="EM1ys3gCsHx6gHexXueNWUPa_eCLggabo_OsC412q5bdA8jackPykT2ikGVa68Hoyhl-HW3tu6mFPZ3C"\n`;

        const fs = require('fs');
        fs.writeFileSync("encoded_env.txt", newEnv);
        
        await client.uploadFrom("encoded_env.txt", ".env");
        console.log("✅ .env actualizado con password encodeada");

        // trigger auto heal
        await client.remove("app.log").catch(() => {});
        console.log("✅ app.log borrado para limpiar");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

encodeEnvPassword();
