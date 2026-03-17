<?php
        echo "Killing port 3000 process:\n";
        echo shell_exec("fuser -k 3000/tcp 2>&1");
        echo "\nKilling all node processes:\n";
        echo shell_exec("killall -9 node 2>&1");
        echo "\nDeleting old app.log:\n";
        unlink('app.log');
        echo "\nStarting new node process in background:\n";
        $node_path = "/home3/camquote/public_html/node_local/bin/node";
        $cmd = "cd ".__DIR__." && NODE_ENV=production $node_path next-server.js > app.log 2>&1 &";
        echo shell_exec($cmd);
        echo "Done.";
        ?>