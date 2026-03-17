import * as ftp from "basic-ftp";
import * as fs from "fs";

async function testTcp() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const phpCode = `<?php
$port = 3005;
$sock = @socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
if (!$sock) {
    die("socket_create failed");
}
if (!@socket_bind($sock, '127.0.0.1', $port)) {
    die("socket_bind failed");
}
socket_listen($sock, 5);

$pid = pcntl_fork();
if ($pid == 0) {
    // Child - accept
    $client = socket_accept($sock);
    socket_write($client, "HELLO");
    socket_close($client);
    exit;
}

// Parent - connect
usleep(100000); // 100ms
$ch = curl_init("http://127.0.0.1:3005/");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
if ($res === false) {
    echo "CURL FAILED: " . curl_error($ch);
} else {
    echo "CURL SUCCESS: " . $res;
}
curl_close($ch);
socket_close($sock);
?>`;
        
        fs.writeFileSync("test-tcp.php", phpCode);
        await client.uploadFrom("test-tcp.php", "test-tcp.php");
        console.log("✅ subido test-tcp.php");

    } catch (err: any) {
        console.error("Error connecting:", err.message);
    } finally {
        client.close();
    }
}

testTcp();
