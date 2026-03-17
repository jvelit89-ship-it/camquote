import * as ftp from "basic-ftp";
import * as fs from "fs";

async function check503Logs() {
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
    echo "=== PS ===\\n";
    echo shell_exec("ps aux 2>&1");
    echo "\\n=== ERROR LOG ===\\n";
    if (file_exists('error_log')) {
        echo shell_exec("tail -n 30 error_log 2>&1");
    } else {
        echo "No error_log in public_html";
    }
    echo "\\n=== ROOT ERROR LOG ===\\n";
    if (file_exists('../logs/camquote.cc-error_log')) {
        echo shell_exec("tail -n 30 ../logs/camquote.cc-error_log 2>&1");
    } else {
        echo "No cpanel standard error log found in ../logs/";
    }
?>`;
        fs.writeFileSync("diagnose-503.php", phpCode);
        await client.uploadFrom("diagnose-503.php", "diagnose-503.php");
        console.log("✅ subido diagnose-503.php");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

check503Logs();
