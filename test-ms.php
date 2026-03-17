<?php
$node_path = "/home3/camquote/public_html/node_local/bin/node";
$out = shell_exec("$node_path test-mysql.js 2>&1");
echo "OUTPUT:
$out
";
?>