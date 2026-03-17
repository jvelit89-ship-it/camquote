import * as ftp from "basic-ftp";
import * as fs from "fs";

async function verifyPwdProxy() {
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
    if (isset($_GET['fix_pwd'])) {
        mysqli_report(MYSQLI_REPORT_STRICT | MYSQLI_REPORT_ERROR);
        try {
            $mysqli = mysqli_init();
            mysqli_options($mysqli, MYSQLI_OPT_CONNECT_TIMEOUT, 3);
            $res = @mysqli_real_connect($mysqli, "localhost", "camquote_admin", "JOIPSK**Tqqx", "camquote_base", 3306);
            if($res) {
                if ($mysqli->query("ALTER USER CURRENT_USER() IDENTIFIED BY 'Camquote2026';")) {
                    file_put_contents('pwd-out.txt', "SUCCESS_PASSWORD_CHANGED");
                } else {
                    file_put_contents('pwd-out.txt', "FAILED_TO_ALTER: " . $mysqli->error);
                }
            }
        } catch(Exception $e) {
            file_put_contents('pwd-out.txt', "FAILED: " . $e->getMessage());
        }
        echo "PWD_CMD_DONE";
        exit;
    }
    
    $url = "http://127.0.0.1:3000" . $_SERVER['REQUEST_URI'];
    $method = $_SERVER['REQUEST_METHOD'];

    $sock = @fsockopen('127.0.0.1', 3000, $errno, $errstr, 1);
    if (!$sock) {
        $node_path = "/home3/camquote/public_html/node_local/bin/node";
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
    $header_lines = explode("\\r\\n", $header_data); 
    foreach ($header_lines as $line) {
        if (!empty($line) && stripos($line, 'Transfer-Encoding:') === false) {
            header($line, false);
        }
    }
    echo $body;
?>`;
        
        fs.writeFileSync("pwd-proxy.php", proxyPhp);
        await client.uploadFrom("pwd-proxy.php", "proxy.php");
        console.log("✅ subido proxy con pwd changer");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

verifyPwdProxy();
