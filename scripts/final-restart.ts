import * as ftp from "basic-ftp";
import * as fs from "fs";

async function finalRestart() {
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
echo "=== KILLING ===\n";
shell_exec("killall -9 node");
shell_exec("killall -9 script");
shell_exec("pkill -f node");

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

sleep(2);
echo "=== STARTING ===\n";
// Add </dev/null to fully unbind from PHP process!
// Add HOSTNAME=127.0.0.1 to allow PHP proxy connect over 127.0.0.1 seamlessly!
$out = shell_exec("cd $app_dir && env HOSTNAME=127.0.0.1 NODE_ENV=production PORT=3000 nohup $node_path $script_path > app.log 2>&1 </dev/null & echo $!");
echo "PID: $out\n";
?>`;
        fs.writeFileSync("restart.php", phpCode);
        await client.uploadFrom("restart.php", "restart.php");
        console.log("✅ subido restart.php");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

finalRestart();
