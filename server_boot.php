<?php
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
?>