import * as ftp from "basic-ftp";
import * as fs from "fs";
import * as http from "http";

async function bypassPassengerAndDeployProxy() {
    const client = new ftp.Client();
    try {
        console.log("📥 Conectando por FTP para bypassear Passenger...");
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        // 1. Rename server.js to next-server.js so Passenger ignores the directory
        console.log("Renombrando server.js a next-server.js...");
        try { await client.rename("server.js", "next-server.js"); } catch(e) {}
        
        // 2. Upload proxy.php (the fixed version)
        const proxyPhp = `<?php
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
        $url = 'http://localhost:3000' . $_SERVER['REQUEST_URI'];
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
        $header_lines = explode("\\\\r\\\\n", $header_data); 
        foreach ($header_lines as $line) {
            if (!empty($line) && stripos($line, 'Transfer-Encoding:') === false) {
                header($line, false);
            }
        }

        echo $body;
        ?>`;

        fs.writeFileSync("proxy.php", proxyPhp.replace(/\\\\r\\\\n/g, "\\r\\n"));
        await client.uploadFrom("proxy.php", "proxy.php");
        fs.unlinkSync("proxy.php");

        // 3. Upload safe .htaccess routing to proxy.php NO PASSENGER DIRECTIVES
        const htaccessContent = `DirectoryIndex proxy.php

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^(.*)$ proxy.php [QSA,L]
</IfModule>
`;
        fs.writeFileSync("htaccess_safe", htaccessContent);
        await client.uploadFrom("htaccess_safe", ".htaccess");
        fs.unlinkSync("htaccess_safe");

        // 4. Start Next.js 20 using Next-server.js
        const startPhp = `<?php
        $dir = __DIR__;
        $nodePath = $dir . '/node_local/bin/node';
        
        // Kill existing node on 3000 if any
        shell_exec("kill -9 $(lsof -t -i:3000) 2>/dev/null; pkill -f node");
        
        $command = "cd $dir && NODE_ENV=production PORT=3000 nohup $nodePath next-server.js > app.log 2>&1 & echo $!";
        $pid = shell_exec($command);
        
        echo "Started Node 20 with PID: $pid\\n";
        ?>`;

        fs.writeFileSync("start-proxy.php", startPhp);
        await client.uploadFrom("start-proxy.php", "start-proxy.php");
        fs.unlinkSync("start-proxy.php");

        try {
            // Wait a moment for FTP uploads to sync before pinging
            await new Promise(r => setTimeout(r, 1000));
            
            console.log("🚀 Llamando a start-proxy.php por HTTP...");
            const response = await new Promise<string>((resolve, reject) => {
                const http = require("http");
                const req = http.get("http://camquote.cc/start-proxy.php", (res: any) => {
                    let data = "";
                    res.on("data", (chunk: any) => data += chunk);
                    res.on("end", () => resolve("HTTP " + res.statusCode + "\\n" + data));
                });
                req.on("error", reject);
                req.end();
            });
            console.log("   Resultados:", response);
            
            // Clean up
            await client.remove("start-proxy.php");
            
        } catch(e) {
            console.log("Blind HTTP ping failed.");
        }

    } catch (err: any) {
        console.error("❌ FTP Error:", err.message);
    } finally {
        client.close();
    }
}

bypassPassengerAndDeployProxy();
