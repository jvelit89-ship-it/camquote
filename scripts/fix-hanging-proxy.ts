import * as ftp from "basic-ftp";
import * as fs from "fs";

async function fixHangingProxy() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        let proxyCode = fs.readFileSync("scripts/verify-pwd-proxy-stealth.ts", "utf8");
        // We will just rewrite proxy.php using FTP directly, fixing the shell_exec
        const proxyPhp = `<?php
    $url = "http://127.0.0.1:3000" . $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];

    $sock = @fsockopen('127.0.0.1', 3000, $errno, $errstr, 1);
    if (!$sock) {
        $node_path = "/home3/camquote/public_html/node_local/bin/node";
        shell_exec("killall -9 node");
        shell_exec("pkill -f node");
        
        // Spawn natively with full detachment (no script wrapper, trying nohup carefully)
        // CloudLinux can sometimes kill it, but let's just make sure PHP doesn't hang!
        shell_exec("nohup ./start-node2.sh > app.log 2>&1 </dev/null &");
        
        for($i=0; $i<15; $i++) {
            usleep(500000); // 500ms
            $sock2 = @fsockopen('127.0.0.1', 3000, $err, $errs, 1);
            if ($sock2) { fclose($sock2); break; }
        }
    } else {
        fclose($sock);
    }

    $headers = getallheaders();
    $headers_array = [];
    foreach ($headers as $key => $value) {
        if (strtolower($key) !== 'host' && strtolower($key) !== 'connection') {
            $headers_array[] = "$key: $value";
        }
    }
    $headers_array[] = "X-Forwarded-For: " . $_SERVER['REMOTE_ADDR'];
    $headers_array[] = "X-Forwarded-Proto: " . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers_array);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    
    if ($method !== 'GET' && $method !== 'HEAD') {
        $input = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    }

    $response = curl_exec($ch);
    if ($response === false) {
        http_response_code(502);
        echo "Bad Gateway - Node.js did not start. Error: " . curl_error($ch);
        curl_close($ch);
        exit;
    }

    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $header_data = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);
    http_response_code($http_code);
    $header_lines = explode("\\r\\n", $header_data); 
    foreach ($header_lines as $line) {
        if (!empty($line) && stripos($line, 'Transfer-Encoding:') === false) {
            header($line, false);
        }
    }
    echo $body;
?>`;
        
        fs.writeFileSync("fixed-proxy.php", proxyPhp);
        await client.uploadFrom("fixed-proxy.php", "proxy.php");
        console.log("✅ subido fixed-proxy.php");

        // Download app.log to see if it crashed
        try {
            await client.downloadTo("app_live_now.log", "app.log");
            console.log("✅ Descargado app.log (tam: " + fs.statSync('app_live_now.log').size + ")");
        } catch(e) {
            console.log("No hay app.log");
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

fixHangingProxy();
