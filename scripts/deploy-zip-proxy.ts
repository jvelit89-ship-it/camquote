import * as ftp from "basic-ftp";
import * as path from "path";
import * as fs from "fs";

async function deployZipOnly() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        console.log("🚀 Connected to FTP");
        await client.cd("public_html");
        
        // Ensure unzip.php exists
        const unzipPhp = `<?php
$zip = new ZipArchive;
$res = $zip->open('deploy.zip');
if ($res === TRUE) {
  $zip->extractTo('./');
  $zip->close();
  echo 'ok';
} else {
  echo 'failed';
}
?>`;
        fs.writeFileSync("unzip.php", unzipPhp);

        console.log("📤 Uploading unzip.php...");
        await client.uploadFrom("unzip.php", "unzip.php");

        console.log("📤 Uploading deploy.zip (this may take a minute)...");
        await client.uploadFrom(path.join(process.cwd(), "deploy.zip"), "deploy.zip");

        console.log("✅ Files uploaded!");

    } catch (err) {
        console.error("❌ Error during deployment:", err);
    } finally {
        client.close();
    }
}

deployZipOnly();
