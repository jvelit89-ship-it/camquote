<?php
    if (isset($_GET['test_db'])) {
        $node_path = "/home3/camquote/public_html/node_local/bin/node";
        $app_dir = __DIR__;
        $out = shell_exec("cd $app_dir && $node_path test-ndb.js 2>&1");
        file_put_contents('ndb-out.txt', $out);
        echo "TEST_DB_DONE";
        exit;
    }
    
    $url = "http://127.0.0.1:3000" . $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];

    $sock = @fsockopen('127.0.0.1', 3000, $errno, $errstr, 1);
    if (!$sock) {
        $node_path = "/home3/camquote/public_html/node_local/bin/node";
        $script_path = __DIR__ . "/next-server.js";
        shell_exec("killall -9 node");
        shell_exec("pkill -f node");
        shell_exec("killall -9 script");
        shell_exec("script -q -c './start-node2.sh' app.log &");
        for($i=0; $i<10; $i++) {
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
        echo "Bad Gateway";
        curl_close($ch);
        exit;
    }

    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $header_data = substr($response, 0, $header_size);
    $body = substr($response, $header_size);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);
    http_response_code($http_code);
    $header_lines = explode("\r\n", $header_data); 
    foreach ($header_lines as $line) {
        if (!empty($line) && stripos($line, 'Transfer-Encoding:') === false) {
            header($line, false);
        }
    }
    echo $body;
?>