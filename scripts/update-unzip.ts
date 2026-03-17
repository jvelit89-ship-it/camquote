import * as ftp from "basic-ftp";
import * as fs from "fs";

const unzipPhp = `<?php
echo "Killing node process...<br/>";
$dir = __DIR__;
$pid_file = "$dir/node.pid";
if (file_exists($pid_file)) {
    $old_pid = trim(file_get_contents($pid_file));
    if (is_numeric($old_pid)) {
        shell_exec("kill -9 $old_pid 2>/dev/null");
        echo "Killed old process PID: $old_pid<br/>";
    }
}
shell_exec("pkill -f 'node.*next-server.js'");

echo "Extracting zip...<br/>";
$zipFile = 'deploy.zip';
$extractPath = './';

if (!file_exists($zipFile)) {
    die("Error: No se encontró el archivo $zipFile");
}

$zip = new ZipArchive;
if ($zip->open($zipFile) === TRUE) {
    if ($zip->extractTo($extractPath)) {
        echo "✅ Archivos extraídos con éxito en $extractPath<br/>";
    } else {
        echo "❌ Error al extraer los archivos.<br/>";
    }
    $zip->close();
} else {
    echo "❌ No se pudo abrir el archivo ZIP.<br/>";
}

echo "<br/>Para reiniciar la app visita <a href='/boot.php'>/boot.php</a>";
?>`;

async function updateUnzip() {
    fs.writeFileSync("unzip2.php", unzipPhp);
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        await client.uploadFrom("unzip2.php", "unzip.php");
        console.log("Uploaded new unzip.php");
    } catch (err: any) {
        console.error("Error:", err.message);
    } finally {
        client.close();
        fs.unlinkSync("unzip2.php");
    }
}

updateUnzip();
