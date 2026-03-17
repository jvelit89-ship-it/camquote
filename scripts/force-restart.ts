import * as ftp from "basic-ftp";
import * as fs from "fs";

async function forceRestart() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        const killAllPhp = `<?php
echo "=== PROCESSES ===\n";
echo shell_exec("ps aux | grep node 2>&1");
echo "\n=== KILLING ===\n";
echo shell_exec("killall -9 node 2>&1");
echo shell_exec("pkill -f node 2>&1");

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

sleep(3);
echo "\n=== STARTING ===\n";
$out = shell_exec("cd $app_dir && NODE_ENV=production PORT=3000 nohup $node_path $script_path > app.log 2>&1 & echo $!"); 
echo "Started new node process: $out\n";
?>`;
        fs.writeFileSync("force.php", killAllPhp);
        await client.uploadFrom("force.php", "force.php");
        console.log("✅ force.php subido");
    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

forceRestart();
