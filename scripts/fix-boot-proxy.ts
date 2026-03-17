import * as ftp from "basic-ftp";
import * as fs from "fs";

const bootPhpContent = `<?php
echo "<h1>Booting Node.js on 3005...</h1>";

$dir = __DIR__;
$node_path = "/home3/camquote/public_html/node_local/bin/node";
$pid_file = "$dir/node.pid";

// Kill existing process if any
if (file_exists($pid_file)) {
    $old_pid = trim(file_get_contents($pid_file));
    if (is_numeric($old_pid)) {
        shell_exec("kill -9 $old_pid 2>/dev/null");
        echo "Killed old process PID: $old_pid<br/>";
    }
}

// Ensure no other node processes are lingering on our specific folder
shell_exec("pkill -f 'node.*next-server.js'");

$cmd = "cd $dir && HOSTNAME=127.0.0.1 PORT=3005 NODE_ENV=production $node_path next-server.js > app.log 2>&1 & echo $!";
$new_pid = shell_exec($cmd);

if (is_numeric(trim($new_pid))) {
    file_put_contents($pid_file, trim($new_pid));
    echo "Started new process PID: $new_pid<br/>";
} else {
    echo "Failed to get PID for new process.<br/>";
}

echo "Sent boot command to port 3005. Checking port...<br/>";

// wait a bit for Next.js to start
sleep(2);

// check if port is open
$fp = @fsockopen("127.0.0.1", 3005, $errno, $errstr, 5);
if (!$fp) {
    echo "<h2 style='color:red'>Node.js failed to start on 3005: $errstr ($errno)</h2>";
    echo "<h3>app.log tail:</h3>";
    $log = shell_exec("tail -n 20 $dir/app.log");
    echo "<pre>$log</pre>";
} else {
    echo "<h2 style='color:green'>Node.js is UP on 3005! <a href='/'>Go to site</a></h2>";
    fclose($fp);
}
?>
`;

const proxyPhpContent = `<?php
    $url = "http://127.0.0.1:3005" . $_SERVER['REQUEST_URI'];
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
        echo "Bad Gateway - Node.js backend en puerto 3005 está down. Visita /boot.php para iniciarlo manualmente. Error: $error";
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
?>
`;

async function updateScripts() {
    fs.writeFileSync("boot.php.temp", bootPhpContent);
    fs.writeFileSync("proxy.php.temp", proxyPhpContent);

    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        await client.uploadFrom("boot.php.temp", "boot.php");
        await client.uploadFrom("proxy.php.temp", "proxy.php");
        console.log("Uploaded boot.php and proxy.php");
    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
        fs.unlinkSync("boot.php.temp");
        fs.unlinkSync("proxy.php.temp");
    }
}

updateScripts();
