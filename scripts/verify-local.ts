import * as ftp from "basic-ftp";
import * as fs from "fs";

async function verifyLocalhost() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const testPhp = `<?php
    echo "=== TEST LOCALHOST:3000 ===\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:3000/login");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Status: $http_code\n";
    if ($http_code == 200) {
        echo "Server is responding properly.\n";
    } else {
        echo "Server returned bad code or timeout.\n";
    }
?>`;
        fs.writeFileSync("test-local.php", testPhp);
        await client.uploadFrom("test-local.php", "test-local.php");
        fs.unlinkSync("test-local.php");
        console.log("✅ test-local.php subido");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

verifyLocalhost();
