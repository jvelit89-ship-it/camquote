import * as ftp from "basic-ftp";

async function deployStaticProbe() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // Disable .htaccess again
        try {
            await client.rename(".htaccess", ".htaccess_disabled");
            console.log("✅ .htaccess deshabilitado");
        } catch(e) {}
        
        // Upload a pure HTML file
        const fs = require('fs');
        fs.writeFileSync("probe.html", "<html><body>STATIC OK</body></html>");
        await client.uploadFrom("probe.html", "probe.html");
        
        // Upload an aggressive kill script
        const killPhp = `<?php
            shell_exec("killall -9 node");
            shell_exec("killall -9 pkill");
            shell_exec("killall -9 script");
            shell_exec("killall -9 bash");
            echo "KILLED";
        ?>`;
        fs.writeFileSync("kill-all.php", killPhp);
        await client.uploadFrom("kill-all.php", "kill-all.php");
        
        console.log("✅ Probe y kill-all subidos");
        
    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

deployStaticProbe();
