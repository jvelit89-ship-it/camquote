import * as ftp from "basic-ftp";
import * as fs from "fs";

async function makeAutoHealProxy() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // Ensure start-node2.sh exists for the persistent script
        const shCode = `#!/bin/bash
export NODE_ENV=production
export PORT=3000
export HOSTNAME=127.0.0.1
exec /home3/camquote/public_html/node_local/bin/node next-server.js
`;
        fs.writeFileSync("start-node2.sh", shCode);
        await client.uploadFrom("start-node2.sh", "start-node2.sh");
        
        // Make proxy.php auto-start Node if it's dead
        const proxyPhp = `<?php
    $url = "http://127.0.0.1:3000" . $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];

    // Auto-heal logic: check if port 3000 is open. If not, start Node!
    $sock = @fsockopen('127.0.0.1', 3000, $errno, $errstr, 1);
    if (!$sock) {
        $node_path = "/home3/camquote/public_html/node_local/bin/node";
        $script_path = __DIR__ . "/next-server.js";
        $app_dir = __DIR__;
        
        // Clean old processes
        shell_exec("killall -9 node");
        shell_exec("pkill -f node");
        shell_exec("killall -9 script");
        shell_exec("chmod +x start-node2.sh");
        
        // Spawn
        shell_exec("script -q -c './start-node2.sh' app.log &");
        
        // Wait up to 5 seconds for it to bind
        for($i=0; $i<10; $i++) {
            usleep(500000); // 500ms
            $sock2 = @fsockopen('127.0.0.1', 3000, $err, $errs, 1);
            if ($sock2) {
                fclose($sock2);
                break;
            }
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
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

    if ($method !== 'GET' && $method !== 'HEAD') {
        $input = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
    }

    $response = curl_exec($ch);
    
    // We attempt fallback if first try failed during boot up
    if ($response === false) {
        sleep(2);
        $response = curl_exec($ch);
    }

    if ($response === false) {
        http_response_code(502);
        echo "Bad Gateway: Next.js backend on port 3000 is unreachable. Error: " . curl_error($ch);
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
        
        fs.writeFileSync("auto-proxy.php", proxyPhp);
        await client.uploadFrom("auto-proxy.php", "proxy.php");
        console.log("✅ proxy.php reescrito con auto-reparador");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

makeAutoHealProxy();
