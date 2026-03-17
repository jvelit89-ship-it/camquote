import * as ftp from "basic-ftp";

async function fixEnvSocket() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        let newEnv = `DATABASE_URL="mysql://camquote_admin:JOIPSK**Tqqx@localhost/camquote_base?socketPath=/var/lib/mysql/mysql.sock"\n`;
        newEnv += `NEXT_PUBLIC_PAYPAL_CLIENT_ID="AXfz2HFvB-EJlo4xmNmAqIEUF5cmfixlrd0mcFyS-qzUSjk-i6k37GjsyzowGChUKSGuU7PKuvKTEc3r"\n`;
        newEnv += `PAYPAL_SECRET_KEY="EM1ys3gCsHx6gHexXueNWUPa_eCLggabo_OsC412q5bdA8jackPykT2ikGVa68Hoyhl-HW3tu6mFPZ3C"\n`;

        const fs = require('fs');
        fs.writeFileSync("fixed_env_socket.txt", newEnv);
        
        await client.uploadFrom("fixed_env_socket.txt", ".env");
        console.log("✅ .env actualizado con socketPath");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

fixEnvSocket();
