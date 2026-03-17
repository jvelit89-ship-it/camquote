import * as ftp from "basic-ftp";
import * as fs from "fs";

async function forceKillStart() {
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
echo "=== FINDING AND KILLING NODE OVER PS ===\n";
// Kill explicitly by parsing ps output because killall and pkill might be restricted or failing
shell_exec("ps -u camquote -o pid,command | grep '[n]ode' | awk '{print $1}' | xargs -r kill -9");

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

sleep(3);

echo "=== STARTING NEW NODE ===\n";
$out = shell_exec("cd $app_dir && env HOSTNAME=127.0.0.1 NODE_ENV=production PORT=3000 nohup $node_path $script_path > app.log 2>&1 </dev/null & echo $!");
echo "PID: $out\n";
?>`;
        fs.writeFileSync("force-kill.php", phpCode);
        await client.uploadFrom("force-kill.php", "force-kill.php");
        console.log("✅ subido force-kill.php");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

forceKillStart();
