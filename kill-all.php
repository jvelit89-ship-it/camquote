<?php
            shell_exec("killall -9 node");
            shell_exec("killall -9 pkill");
            shell_exec("killall -9 script");
            shell_exec("killall -9 bash");
            echo "KILLED";
        ?>