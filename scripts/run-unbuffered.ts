import * as ftp from "basic-ftp";
import * as fs from "fs";

async function runUnbuffered() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const shCode = `#!/bin/bash
export NODE_ENV=production
export PORT=3000
exec /home3/camquote/public_html/node_local/bin/node next-server.js
`;
        fs.writeFileSync("start-node.sh", shCode);
        await client.uploadFrom("start-node.sh", "start-node.sh");

        const phpCode = `<?php
shell_exec("killall -9 node");
shell_exec("pkill -f node");
shell_exec("chmod +x start-node.sh");

// Use script -c to capture tty output which is line-buffered!
$out = shell_exec("script -q -c './start-node.sh' /dev/null & echo $!");
echo "PID: $out\n";
?>`;
        fs.writeFileSync("start-unbuf.php", phpCode);
        await client.uploadFrom("start-unbuf.php", "start-unbuf.php");
        console.log("✅ subido start-unbuf");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

runUnbuffered();
