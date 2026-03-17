import * as ftp from "basic-ftp";
import * as fs from "fs";

async function persistentRestart() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // 1. start-node.sh binds to 127.0.0.1
        const shCode = `#!/bin/bash
export NODE_ENV=production
export PORT=3000
export HOSTNAME=127.0.0.1
exec /home3/camquote/public_html/node_local/bin/node next-server.js
`;
        fs.writeFileSync("start-node2.sh", shCode);
        await client.uploadFrom("start-node2.sh", "start-node2.sh");

        // 2. php script kills old ones and spawns via script
        const phpCode = `<?php
shell_exec("killall -9 node");
shell_exec("pkill -f node");
shell_exec("killall -9 script");
shell_exec("chmod +x start-node2.sh");

// Launch via script to allocate a pseudoterminal. This evades CloudLinux background process death!
// Write output to app.log natively so we can still read it.
$out = shell_exec("script -q -c './start-node2.sh' app.log & echo $!");
echo "PID: $out\n";
?>`;
        fs.writeFileSync("start-persistent.php", phpCode);
        await client.uploadFrom("start-persistent.php", "start-persistent.php");
        console.log("✅ subido start-persistent");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

persistentRestart();
