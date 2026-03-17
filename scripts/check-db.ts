import * as ftp from "basic-ftp";
import * as fs from "fs";

async function checkDB() {
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

function test_conn($host, $port=3306) {
    echo "Testing $host:$port... ";
    $mysqli = mysqli_init();
    mysqli_options($mysqli, MYSQLI_OPT_CONNECT_TIMEOUT, 3);
    $start = microtime(true);
    $res = @mysqli_real_connect($mysqli, $host, $user, $pass, $db, $port);
    $end = microtime(true);
    $time = round($end - $start, 2);
    if($res) {
        echo "SUCCESS in {$time}s\\n";
    } else {
        echo "FAILED in {$time}s: " . mysqli_connect_error() . "\\n";
    }
}

test_conn("localhost");
test_conn("127.0.0.1");
test_conn("162.241.85.85");
?>`;
        
        fs.writeFileSync("check-db.php", phpCode);
        await client.uploadFrom("check-db.php", "check-db.php");
        console.log("✅ subido check-db.php");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

checkDB();
