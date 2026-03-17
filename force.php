<?php
echo "=== PROCESSES ===
";
echo shell_exec("ps aux | grep node 2>&1");
echo "
=== KILLING ===
";
echo shell_exec("killall -9 node 2>&1");
echo shell_exec("pkill -f node 2>&1");

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

sleep(3);
echo "
=== STARTING ===
";
$out = shell_exec("cd $app_dir && NODE_ENV=production PORT=3000 nohup $node_path $script_path > app.log 2>&1 & echo $!"); 
echo "Started new node process: $out
";
?>