import * as ftp from "basic-ftp";
import * as fs from "fs";

async function verifyOrganicLoad() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const proxyPhp = `<?php
    $url = "http://127.0.0.1:3000" . $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];

    $sock = @fsockopen('127.0.0.1', 3000, $errno, $errstr, 1);
    if (!$sock) {
        $node_path = "/home3/camquote/public_html/node_local/bin/node";
        shell_exec("killall -9 node");
        shell_exec("pkill -f node");
        
        shell_exec("chmod +x start-node2.sh");
        // Use exec with fully redirected I/O to safely background the process in CloudLinux
        exec("nohup ./start-node2.sh > app.log 2>&1 < /dev/null &");
        
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
    
    // Generous timeout
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

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
        
        fs.writeFileSync("user-proxy.php", proxyPhp);
        await client.uploadFrom("user-proxy.php", "proxy.php");
        console.log("✅ subido proxy final con exec() seguro");

        // Let's check if the previous run by the user created an app.log!
        try {
            await client.downloadTo("app_after_user.log", "app.log");
            console.log("✅ app.log info: ", fs.statSync("app_after_user.log").size + " bytes");
        } catch(e) {
            console.log("❌ No hay app.log, el proceso Node no arrancó en la visita del usuario.");
        }

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

verifyOrganicLoad();
