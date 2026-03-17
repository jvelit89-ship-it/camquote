import * as ftp from "basic-ftp";
import * as fs from "fs";

async function makeMinimalHtaccess() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const htaccessCode = `
<IfModule mod_security.c>
  SecFilterEngine Off
  SecFilterScanPOST Off
</IfModule>
<IfModule mod_security2.c>
  SecRuleEngine Off
</IfModule>
`;
        fs.writeFileSync("minimal_htaccess.txt", htaccessCode);
        await client.uploadFrom("minimal_htaccess.txt", ".htaccess");
        console.log("✅ subido .htaccess minimal (sin proxy, solo modsec)");

        // try to fetch the output of the query script directly
    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

makeMinimalHtaccess();
