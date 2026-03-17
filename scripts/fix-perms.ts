import * as ftp from "basic-ftp";
import * as fs from "fs";

async function fixPerms() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        const phpCode = `<?php
echo "=== FIXING PERMISSIONS ===\n";
shell_exec("chmod -R 755 .next");

echo "=== KILLING NODE ===\n";
shell_exec("killall -9 node 2>&1");
shell_exec("pkill -f node 2>&1");

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

sleep(2);
echo "=== STARTING NODE ===\n";
$out = shell_exec("cd $app_dir && NODE_ENV=production PORT=3000 nohup $node_path $script_path > app.log 2>&1 & echo $!"); 
echo "Started new node process: $out\n";
?>`;
        fs.writeFileSync("fix-perms.php", phpCode);
        await client.uploadFrom("fix-perms.php", "fix-perms.php");
        console.log("✅ fix-perms.php subido");
    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

fixPerms();
