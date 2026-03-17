<?php
shell_exec("killall -9 node");
shell_exec("pkill -f node");
shell_exec("chmod +x start-node.sh");

// Use script -c to capture tty output which is line-buffered!
$out = shell_exec("script -q -c './start-node.sh' /dev/null & echo $!");
echo "PID: $out
";
?>