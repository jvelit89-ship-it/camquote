import * as ftp from "basic-ftp";
import * as fs from "fs";

async function readRemoteBuild() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const readScript = `<?php
echo "=== DISK SPACE ===\n";
echo shell_exec("df -h 2>&1");

echo "\n=== BUILD ID CONTENT ===\n";
echo @file_get_contents(".next/BUILD_ID");

echo "\n=== CHUNKS DIR ===\n";
echo shell_exec("ls -la .next/server/chunks/ 2>&1");
?>`;
        fs.writeFileSync("read-build.php", readScript);
        await client.uploadFrom("read-build.php", "read-build.php");
        console.log("✅ read-build.php subido");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

readRemoteBuild();
