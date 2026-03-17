<?php
echo "=== KILLING NODE ===
";
shell_exec("killall -9 node 2>&1");
shell_exec("pkill -f node 2>&1");

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

echo "=== STARTING FOREGROUND NODE ===
";
// This will block and we can capture its output for 10 seconds.
// We use timeout command natively in linux
$out = shell_exec("cd $app_dir && NODE_ENV=production PORT=3000 timeout 10 $node_path $script_path 2>&1");
echo "OUTPUT:
$out
";
?>