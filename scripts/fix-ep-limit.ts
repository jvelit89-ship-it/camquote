import * as ftp from "basic-ftp";
import * as fs from "fs";

async function fixEpLimit() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // 1. Simple, fast proxy (no booting, no hanging)
        const proxyPhp = `<?php
    $url = "http://127.0.0.1:3000" . $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];

    $headers = getallheaders();
    $headers_array = [];
    foreach ($headers as $key => $value) {
        if (strtolower($key) !== 'host' && strtolower($key) !== 'connection' && strtolower($key) !== 'content-length') {
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
    
    // Very fast timeout so it doesn't hang!
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);

    if ($method !== 'GET' && $method !== 'HEAD') {
        $input = file_get_contents('php://input');
        if (strlen($input) > 0) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
            $headers_array[] = "Content-Length: " . strlen($input);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers_array);
        }
    }

    $response = curl_exec($ch);
    if ($response === false) {
        http_response_code(502);
        echo "Bad Gateway - Node.js backend is down. Visita /boot.php para iniciarlo manualmente. Error: " . curl_error($ch);
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
        fs.writeFileSync("fast-proxy.php", proxyPhp);
        await client.uploadFrom("fast-proxy.php", "proxy.php");
        
        // 2. Dedicated boot script
        const bootPhp = `<?php
    echo "<h1>Booting Node.js...</h1>";
    $node_path = "/home3/camquote/public_html/node_local/bin/node";
    shell_exec("killall -9 node 2>/dev/null");
    shell_exec("pkill -f node 2>/dev/null");
    shell_exec("chmod +x start-node2.sh");
    
    // Use shell_exec with proper full backgrounding
    shell_exec("nohup ./start-node2.sh > app.log 2>&1 < /dev/null &");
    
    echo "Sent boot command. Checking port 3000...<br/>";
    $up = false;
    for($i=0; $i<10; $i++) {
        usleep(500000); // 500ms
        $sock = @fsockopen('127.0.0.1', 3000, $err, $errs, 1);
        if ($sock) { 
            fclose($sock);
            $up = true;
            break; 
        }
    }
    
    if ($up) {
        echo "<h2 style='color:green'>Node.js is UP! <a href='/'>Go to site</a></h2>";
    } else {
        echo "<h2 style='color:red'>Node.js failed to bind to port 3000 in time.</h2>";
        // dump app.log
        if (file_exists("app.log")) {
            echo "<h3>app.log content:</h3><pre>" . htmlspecialchars(file_get_contents("app.log")) . "</pre>";
        }
    }
?>`;
        fs.writeFileSync("boot.php", bootPhp);
        await client.uploadFrom("boot.php", "boot.php");
        
        console.log("✅ Subido fast proxy y boot.php separado");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

fixEpLimit();
