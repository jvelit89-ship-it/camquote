import * as ftp from "basic-ftp";
import * as fs from "fs";

async function shiftPort() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // 1. Rewrite proxy.php to use 3001
        const proxyCode = `<?php
    $url = "http://127.0.0.1:3001" . $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];

    $headers = getallheaders();
    $headers_array = [];
    foreach ($headers as $key => $value) {
        if (strtolower($key) !== 'host' && strtolower($key) !== 'connection' && strtolower($key) !== 'content-length') {
            $headers_array[] = "$key: $value";
        }
    }
    $headers_array[] = "X-Forwarded-For: " . $_SERVER['REMOTE_ADDR'];
    $headers_array[] = "X-Forwarded-Host: " . $_SERVER['HTTP_HOST'];
    $headers_array[] = "X-Forwarded-Proto: https";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers_array);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);

    if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
        $body = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

    if ($error) {
        http_response_code(502);
        echo "Bad Gateway - Node.js backend en puerto 3001 está down. Visita /boot.php para iniciarlo manualmente. Error: $error";
        exit;
    }

    $header = substr($response, 0, $header_size);
    $body = substr($response, $header_size);

    http_response_code($http_code);

    $header_lines = explode("\\r\\n", $header);
    foreach ($header_lines as $line) {
        if (!empty($line) && strpos(strtolower($line), 'transfer-encoding') === false) {
            header($line);
        }
    }

    echo $body;
?>`;

        fs.writeFileSync("proxy.php", proxyCode);
        await client.uploadFrom("proxy.php", "proxy.php");
        console.log("Updated proxy.php to use port 3001");

        // 2. Rewrite boot.php to start node on 3001
        const bootCode = `<?php
echo "<h1>Booting Node.js on 3001...</h1>";

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$cmd = "cd ".__DIR__." && PORT=3001 NODE_ENV=production $node_path next-server.js > app.log 2>&1 &";
shell_exec($cmd);

echo "Sent boot command to port 3001. Checking port...<br/>";

// check if port is open
$fp = @fsockopen("127.0.0.1", 3001, $errno, $errstr, 5);
if (!$fp) {
    echo "<h2 style='color:red'>Node.js failed to start on 3001: $errstr ($errno)</h2>";
} else {
    echo "<h2 style='color:green'>Node.js is UP on 3001! <a href='/'>Go to site</a></h2>";
    fclose($fp);
}
?>`;
        fs.writeFileSync("boot.php", bootCode);
        await client.uploadFrom("boot.php", "boot.php");
        console.log("Updated boot.php to start on port 3001");

        // kill old instance just in case
        const phpKillScript = `<?php
        unlink('app.log');
        $node_path = "/home3/camquote/public_html/node_local/bin/node";
        $cmd = "cd ".__DIR__." && PORT=3001 NODE_ENV=production $node_path next-server.js > app.log 2>&1 &";
        shell_exec($cmd);
        echo "Started Node on 3001";
        ?>`;
        fs.writeFileSync("hard-reset-3001.php", phpKillScript);
        await client.uploadFrom("hard-reset-3001.php", "hard-reset-3001.php");
        console.log("Uploaded hard-reset-3001.php");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

shiftPort();
