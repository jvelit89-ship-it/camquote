<?php
shell_exec("killall -9 node");
shell_exec("pkill -f node");
shell_exec("killall -9 script");
shell_exec("chmod +x start-node2.sh");

// Launch via script to allocate a pseudoterminal. This evades CloudLinux background process death!
// Write output to app.log natively so we can still read it.
$out = shell_exec("script -q -c './start-node2.sh' app.log & echo $!");
echo "PID: $out
";
?>