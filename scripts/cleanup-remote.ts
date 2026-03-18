import * as ftp from "basic-ftp";
import * as fs from "fs";

async function cleanupRemote() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("Creando script de limpieza...");
        const phpCode = `<?php
echo "=== INICIANDO LIMPIEZA DE ESPACIO ===\\n";

$files_to_delete = [
    'deploy.zip',
    'next.zip',
    'deploy-output.txt',
    'error_log',
    'app_full.log',
    'npm-debug.log',
    'yarn-error.log'
];

foreach ($files_to_delete as $file) {
    if (file_exists($file)) {
        $size = filesize($file) / 1024 / 1024;
        echo "Borrando $file (" . round($size, 2) . " MB)...\\n";
        unlink($file);
    }
}

// Borrar todo dentro de tmp_install si existe
if (is_dir('tmp_install')) {
    echo "Borrando directorio temporal tmp_install...\\n";
    shell_exec('rm -rf tmp_install');
}

// Borrar carpetas de testzip antiguas si existen
if (is_dir('testzip')) {
    echo "Borrando testzip...\\n";
    shell_exec('rm -rf testzip');
}

echo "\\n=== ESPACIO DESPUES DE LIMPIEZA ===\\n";
echo shell_exec("df -h 2>&1");
?>`;
        
        fs.writeFileSync("run-cleanup.php", phpCode);
        await client.uploadFrom("run-cleanup.php", "run-cleanup.php");
        console.log("✅ Script de limpieza subido");
        
    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

cleanupRemote();
