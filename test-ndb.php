<?php
$node_path = "/home3/camquote/public_html/node_local/bin/node";
$app_dir = __DIR__;
$out = shell_exec("cd $app_dir && $node_path test-ndb.js 2>&1");
file_put_contents('ndb-out.txt', $out);
echo "DONE";
?>