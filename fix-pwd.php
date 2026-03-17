<?php
$user = "camquote_admin";
$pass = "JOIPSK**Tqqx";
$db = "camquote_base";

// Use exceptions
mysqli_report(MYSQLI_REPORT_STRICT | MYSQLI_REPORT_ERROR);

try {
    $mysqli = mysqli_init();
    mysqli_options($mysqli, MYSQLI_OPT_CONNECT_TIMEOUT, 3);
    $res = @mysqli_real_connect($mysqli, "localhost", $user, $pass, $db);
    if($res) {
        if ($mysqli->query("ALTER USER CURRENT_USER() IDENTIFIED BY 'Camquote2026';")) {
            echo "SUCCESS_PASSWORD_CHANGED
";
        } else {
            echo "FAILED_TO_ALTER: " . $mysqli->error . "
";
        }
    }
} catch(Exception $e) {
    echo "FAILED: " . $e->getMessage() . "
";
}
?>