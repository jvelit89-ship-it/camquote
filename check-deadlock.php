<?php
    $out = "";
    $out .= "=== PS NODE ===
";
    $out .= shell_exec("ps aux | grep node 2>&1");
    $out .= "
=== PS PHP ===
";
    $out .= shell_exec("ps aux | grep php 2>&1");
    file_put_contents('deadlock.txt', $out);
    echo "OK";
?>