<?php
echo "=== CLEANING OLD BUILD ===
";
shell_exec("rm -rf .next");

echo "=== KILLING NODE ===
";
shell_exec("killall -9 node 2>&1");
shell_exec("pkill -f node 2>&1");

echo "=== UNZIPPING NEW BUILD ===
";
echo shell_exec("unzip -o deploy.zip 2>&1");

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

sleep(2);
echo "=== STARTING NODE ===
";
$out = shell_exec("cd $app_dir && NODE_ENV=production PORT=3000 nohup $node_path $script_path > app.log 2>&1 & echo $!"); 
echo "Started new node process: $out
";
?>