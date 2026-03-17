import * as ftp from "basic-ftp";
import * as fs from "fs";

async function forceKillPort2() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const phpKillScript = `<?php
        echo "=== FINDING AND KILLING NODE OVER PS ===\\n";
        $ps = shell_exec("ps ux");
        $lines = explode("\\n", $ps);
        foreach($lines as $line) {
            if (strpos($line, 'node') !== false && strpos($line, 'ps ux') === false && strpos($line, 'grep') === false) {
                // Parse PID
                $parts = preg_split('/\\s+/', trim($line));
                if (isset($parts[1]) && is_numeric($parts[1])) {
                    $pid = $parts[1];
                    echo "Killing PID $pid...\\n";
                    echo shell_exec("kill -9 $pid 2>&1");
                }
            }
        }
        
        echo "\\n=== DELETING OLD APP.LOG ===\\n";
        @unlink('app.log');
        
        echo "\\n=== STARTING NEW NODE ===\\n";
        $node_path = "/home3/camquote/public_html/node_local/bin/node";
        $cmd = "cd ".__DIR__." && NODE_ENV=production $node_path next-server.js > app.log 2>&1 & echo $!";
        $new_pid = shell_exec($cmd);
        echo "Started PID: " . trim($new_pid) . "\\n";
        ?>`;

        fs.writeFileSync("hard-reset-2.php", phpKillScript);
        await client.uploadFrom("hard-reset-2.php", "hard-reset-2.php");
        console.log("Uploaded hard-reset-2.php");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

forceKillPort2();
