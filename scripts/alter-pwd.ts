import * as ftp from "basic-ftp";
import * as fs from "fs";

async function alterDbPassword() {
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

try {
    $mysqli = mysqli_init();
    mysqli_options($mysqli, MYSQLI_OPT_CONNECT_TIMEOUT, 3);
    $res = @mysqli_real_connect($mysqli, "localhost", $user, $pass, $db);
    if($res) {
        if ($mysqli->query("ALTER USER CURRENT_USER() IDENTIFIED BY 'Camquote2026';")) {
            echo "SUCCESS_PASSWORD_CHANGED\n";
        } else {
            echo "FAILED_TO_ALTER: " . $mysqli->error . "\n";
        }
    }
} catch(Exception $e) {
    echo "FAILED: " . $e->getMessage() . "\n";
}
?>`;
        
        fs.writeFileSync("fix-pwd.php", phpCode);
        await client.uploadFrom("fix-pwd.php", "fix-pwd.php");
        console.log("✅ subido fix-pwd.php");

    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

alterDbPassword();
