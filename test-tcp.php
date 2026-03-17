<?php
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
?>