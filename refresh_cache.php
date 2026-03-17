<?php
$node_path = "/home3/camquote/public_html/node_local/bin/node";
shell_exec("$node_path test-mysql.js > mysql-output.txt 2>&1");
echo "OK";
?>