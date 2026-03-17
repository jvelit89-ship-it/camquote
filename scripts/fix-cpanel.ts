import * as ftp from "basic-ftp";
import * as fs from "fs";

async function fastCpanelTest() {
    const client = new ftp.Client();
    try {
        console.log("Conectando FTP...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const testCmdContent = `<?php
echo "=== WHICH NODE ===\n";
echo shell_exec("which node 2>&1");
echo "\n=== NODE_LOCAL DIR ===\n";
echo shell_exec("ls -la ~/public_html/node_local/bin/node 2>/dev/null");
echo "\n=== CPANEL NODE ===\n";
echo shell_exec("ls -la /opt/cpanel/ea-nodejs20/bin/node 2>/dev/null");
?>`;
        fs.writeFileSync("test-cmd2.php", testCmdContent);
        await client.uploadFrom("test-cmd2.php", "test-cmd2.php");
        fs.unlinkSync("test-cmd2.php");
        console.log("✅ test-cmd2.php subido.");

    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        client.close();
    }
}

fastCpanelTest();
