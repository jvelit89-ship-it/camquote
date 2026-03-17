<?php
        $dir = __DIR__;
        $nodePath = $dir . '/node_local/bin/node';
        
        // Kill existing node on 3000 if any
        shell_exec("kill -9 $(lsof -t -i:3000) 2>/dev/null; pkill -f node");
        
        $command = "cd $dir && NODE_ENV=production PORT=3000 nohup $nodePath next-server.js > app.log 2>&1 & echo $!";
        $pid = shell_exec($command);
        
        echo "Started Node 20 with PID: $pid\n";
        ?>