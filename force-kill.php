<?php
echo "=== FINDING AND KILLING NODE OVER PS ===
";
// Kill explicitly by parsing ps output because killall and pkill might be restricted or failing
shell_exec("ps -u camquote -o pid,command | grep '[n]ode' | awk '{print $1}' | xargs -r kill -9");

$node_path = "/home3/camquote/public_html/node_local/bin/node";
$script_path = __DIR__ . "/next-server.js";
$app_dir = __DIR__;

sleep(3);

echo "=== STARTING NEW NODE ===
";
$out = shell_exec("cd $app_dir && env HOSTNAME=127.0.0.1 NODE_ENV=production PORT=3000 nohup $node_path $script_path > app.log 2>&1 </dev/null & echo $!");
echo "PID: $out
";
?>