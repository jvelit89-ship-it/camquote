<?php
    echo "=== PS ===\n";
    echo shell_exec("ps aux 2>&1");
    echo "\n=== ERROR LOG ===\n";
    if (file_exists('error_log')) {
        echo shell_exec("tail -n 30 error_log 2>&1");
    } else {
        echo "No error_log in public_html";
    }
    echo "\n=== ROOT ERROR LOG ===\n";
    if (file_exists('../logs/camquote.cc-error_log')) {
        echo shell_exec("tail -n 30 ../logs/camquote.cc-error_log 2>&1");
    } else {
        echo "No cpanel standard error log found in ../logs/";
    }
?>