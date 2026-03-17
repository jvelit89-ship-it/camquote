import * as ftp from "basic-ftp";
import * as fs from "fs";

async function doUnzipSys() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const sysPhp = `<?php
echo "Unzipping deploy.zip...<br>";
$out = shell_exec("unzip -o deploy.zip 2>&1");
echo "<pre>$out</pre>";
?>`;
        fs.writeFileSync("unzip-sys.php", sysPhp);
        await client.uploadFrom("unzip-sys.php", "unzip-sys.php");
        console.log("✅ unzip-sys.php subido");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        fs.unlinkSync("unzip-sys.php");
        client.close();
    }
}

doUnzipSys();
