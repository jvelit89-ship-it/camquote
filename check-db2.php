<?php
$user = "camquote_admin";
$pass = "JOIPSK**Tqqx";
$db = "camquote_base";

// Use exceptions
mysqli_report(MYSQLI_REPORT_STRICT | MYSQLI_REPORT_ERROR);

function test_conn($host, $port=3306) {
    echo "Testing $host:$port... ";
    try {
        $mysqli = mysqli_init();
        mysqli_options($mysqli, MYSQLI_OPT_CONNECT_TIMEOUT, 3);
        $res = @mysqli_real_connect($mysqli, $host, $user, $pass, $db, $port);
        if($res) {
            echo "SUCCESS\n";
        }
    } catch(Exception $e) {
        echo "FAILED: " . $e->getMessage() . "\n";
    }
}

// Test localhost without port (forces socket)
test_conn("localhost", null);
test_conn("localhost", 3306);
test_conn("127.0.0.1", 3306);
?>