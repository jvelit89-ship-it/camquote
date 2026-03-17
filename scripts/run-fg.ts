import * as ftp from "basic-ftp";
import * as fs from "fs";

async function runForeground() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const testScript = `<?php
echo "=== KILLING NODE ===\n";
shell_exec("killall -9 node 2>&1");
shell_exec("pkill -f node 2>&1");

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

echo "=== STARTING FOREGROUND NODE ===\n";
// This will block and we can capture its output for 10 seconds.
// We use timeout command natively in linux
$out = shell_exec("cd $app_dir && NODE_ENV=production PORT=3000 timeout 10 $node_path $script_path 2>&1");
echo "OUTPUT:\n$out\n";
?>`;
        fs.writeFileSync("fg-node.php", testScript);
        await client.uploadFrom("fg-node.php", "fg-node.php");
        console.log("✅ fg-node.php subido");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

runForeground();
