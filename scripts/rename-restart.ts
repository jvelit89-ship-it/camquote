import * as ftp from "basic-ftp";
import * as fs from "fs";

async function renameAndUploadRestart() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        console.log("Renombrando server.js a next-server.js...");
        try {
            await client.rename("server.js", "next-server.js");
        } catch (e: any) {
            console.log("No se pudo renombrar o ya estaba renombrado: " + e.message);
        }

        const restartPhpContent = `<?php
$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

// Mated port 3000 process
$pid = shell_exec("lsof -t -i:3000");
if ($pid) {
    echo "Killing old process PID: $pid\n";
    shell_exec("kill -9 " . trim($pid));
} else {
    // try checking pgrep node
    shell_exec("pkill node");
}
sleep(2);

$out = shell_exec("cd $app_dir && NODE_ENV=production PORT=3000 nohup $node_path $script_path > app.log 2>&1 & echo $!"); 
echo "Started new node process: $out\n";
?>`;
        
        fs.writeFileSync("restart-node.php", restartPhpContent);
        await client.uploadFrom("restart-node.php", "restart-node.php");
        fs.unlinkSync("restart-node.php");
        
        console.log("✅ renameAndUploadRestart finalizado.");

    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        client.close();
    }
}

renameAndUploadRestart();
