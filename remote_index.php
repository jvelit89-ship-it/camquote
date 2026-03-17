<?php
$node_path = "/home3/camquote/public_html/node_local/bin/node";
$cmd = "cd ".__DIR__." && $node_path query-test.js 2>&1";
$out = shell_exec($cmd);
file_put_contents("query-out.txt", $out);
echo "CHECK_COMPLETE";
?>