<?php
echo "=== KILLING ===
";
shell_exec("killall -9 node");
shell_exec("killall -9 script");
shell_exec("pkill -f node");

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

sleep(2);
echo "=== STARTING ===
";
// Add </dev/null to fully unbind from PHP process!
// Add HOSTNAME=127.0.0.1 to allow PHP proxy connect over 127.0.0.1 seamlessly!
$out = shell_exec("cd $app_dir && env HOSTNAME=127.0.0.1 NODE_ENV=production PORT=3000 nohup $node_path $script_path > app.log 2>&1 </dev/null & echo $!");
echo "PID: $out
";
?>