<?php
        error_reporting(E_ALL);
        ini_set('display_errors', 1);

        if (!function_exists('getallheaders')) {
            function getallheaders() {
                $headers = [];
                foreach ($_SERVER as $name => $value) {
                    if (substr($name, 0, 5) == 'HTTP_') {
                        $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
                    }
                }
                return $headers;
            }
        }

        if (!function_exists('curl_init')) {
            http_response_code(500);
            echo "CURL is not enabled in PHP on this server.";
            exit;
        }

        $method = $_SERVER['REQUEST_METHOD'];
        $url = 'http://127.0.0.1:3000' . $_SERVER['REQUEST_URI'];
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
        // Add timeouts so it doesnt hang forever and cause 500
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

        if ($method !== 'GET' && $method !== 'HEAD') {
            $input = file_get_contents('php://input');
            curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
        }

        $response = curl_exec($ch);
        
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
        $header_lines = explode("\r\n", $header_data); 
        foreach ($header_lines as $line) {
            if (!empty($line) && stripos($line, 'Transfer-Encoding:') === false) {
                header($line, false);
            }
        }

        echo $body;
        ?>