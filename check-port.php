<?php
echo "=== PS NODE ===
";
echo shell_exec("ps aux | grep node 2>&1");

echo "
=== NETSTAT 3000 ===
";
echo shell_exec("netstat -tulpn | grep 3000 2>&1");
echo shell_exec("lsof -i:3000 2>&1");
?>