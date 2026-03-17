<?php
        unlink('app.log');
        $node_path = "/home3/camquote/public_html/node_local/bin/node";
        $cmd = "cd ".__DIR__." && PORT=3001 NODE_ENV=production $node_path next-server.js > app.log 2>&1 &";
        shell_exec($cmd);
        echo "Started Node on 3001";
        ?>