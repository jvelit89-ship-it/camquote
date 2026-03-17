import * as ftp from "basic-ftp";
import * as fs from "fs";

async function deployPhpProxy() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para desplegar Proxy en PHP...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const htaccessContent = `<IfModule mod_passenger.c>
  PassengerEnabled off
</IfModule>

<IfModule mime_module>
  AddHandler application/x-httpd-ea-php83___lsphp .php .php8 .phtml
</IfModule>

DirectoryIndex proxy.php

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ proxy.php [QSA,L]
</IfModule>
`;
        fs.writeFileSync("htaccess_temp_proxy", htaccessContent);
        await client.uploadFrom("htaccess_temp_proxy", ".htaccess");
        fs.unlinkSync("htaccess_temp_proxy");
        
        // PHP Proxy Script that forwards everything to 127.0.0.1:3000
        const proxyPhp = `<?php
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
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // Let browser handle redirects

        if ($method !== 'GET' && $method !== 'HEAD') {
            $input = file_get_contents('php://input');
            curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
        }

        $response = curl_exec($ch);
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

        fs.writeFileSync("proxy.php", proxyPhp);
        await client.uploadFrom("proxy.php", "proxy.php");
        fs.unlinkSync("proxy.php");

        console.log("✅ PHP Proxy desplegado.");

    } catch (err: any) {
        console.error("❌ FTP Error:", err.message);
    } finally {
        client.close();
    }
}

deployPhpProxy();
