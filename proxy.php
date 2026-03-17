<?php
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

    $header_lines = explode("\r\n", $header);
    foreach ($header_lines as $line) {
        if (!empty($line) && strpos(strtolower($line), 'transfer-encoding') === false) {
            header($line);
        }
    }

    echo $body;
?>