import * as ftp from "basic-ftp";
import * as path from "path";
import * as fs from "fs";

async function deploy() {
    const client = new ftp.Client();
    client.ftp.verbose = true;
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        console.log("🚀 Connected to FTP");

        // Navigate to public_html
        await client.cd("public_html");
        
        // If there's a nested public_html, go deeper (as seen in test-ftp.ts)
        const list = await client.list();
        if (list.some(f => f.name === "public_html")) {
            await client.cd("public_html");
        }

        console.log("📂 Current directory:", await client.pwd());

        const localBase = path.join(process.cwd(), ".next", "standalone");
        const localStatic = path.join(process.cwd(), ".next", "static");
        const localPublic = path.join(process.cwd(), "public");

        // 1. Upload standalone files
        console.log("📤 Uploading standalone files...");
        await client.uploadFromDir(localBase);

        // 2. Upload static files to .next/static
        console.log("📤 Uploading static files...");
        await client.ensureDir(".next/static");
        await client.uploadFromDir(localStatic);

        // 3. Upload public files to public/
        console.log("📤 Uploading public files...");
        await client.ensureDir("public");
        await client.uploadFromDir(localPublic);

        // 4. Upload .htaccess to root (overwriting if needed)
        const htaccessContent = `
# php -- BEGIN cPanel-generated handler, do not edit
# Set the “ea-php83” package as the default “PHP” programming language.
<IfModule mime_module>
  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml
</IfModule>
# php -- END cPanel-generated handler, do not edit

RewriteEngine On
RewriteBase /
RewriteRule ^index\\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /server.js [L]
`;
        fs.writeFileSync("htaccess_deploy", htaccessContent);
        await client.uploadFrom("htaccess_deploy", ".htaccess");
        fs.unlinkSync("htaccess_deploy");

        console.log("✅ Deployment finished!");

    } catch (err) {
        console.error("❌ Error during deployment:", err);
    } finally {
        client.close();
    }
}

deploy();
