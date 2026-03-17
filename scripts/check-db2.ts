import * as ftp from "basic-ftp";
import * as fs from "fs";

async function checkDbComplete() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        const phpCode = `<?php
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
            echo "SUCCESS\\n";
        }
    } catch(Exception $e) {
        echo "FAILED: " . $e->getMessage() . "\\n";
    }
}

// Test localhost without port (forces socket)
test_conn("localhost", null);
test_conn("localhost", 3306);
test_conn("127.0.0.1", 3306);
?>`;
        
        fs.writeFileSync("check-db2.php", phpCode);
        await client.uploadFrom("check-db2.php", "check-db2.php");
        console.log("✅ subido check-db2.php");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

checkDbComplete();
