import * as ftp from "basic-ftp";
import * as fs from "fs";

async function deepCleanup() {
    const client = new ftp.Client();
    try {
        await client.access({
            host: "ftp.camquote.cc",
            user: "antigravity@camquote.cc",
            password: "Related123@",
            secure: false
        });

        await client.cd("public_html");
        
        console.log("Creando script de limpieza PROFUNDA...");
        const phpCode = `<?php
echo "=== INICIANDO LIMPIEZA PROFUNDA DE ESPACIO ===\\n";

// Función para vaciar y borrar directorios recursivamente
function rrmdir($dir) {
    if (is_dir($dir)) {
        $objects = scandir($dir);
        foreach ($objects as $object) {
            if ($object != "." && $object != "..") {
                if (is_dir($dir. DIRECTORY_SEPARATOR .$object) && !is_link($dir."/".$object))
                    rrmdir($dir. DIRECTORY_SEPARATOR .$object);
                else
                    unlink($dir. DIRECTORY_SEPARATOR .$object);
            }
        }
        rmdir($dir);
    }
}

// 1. Borrar builds/caches de standalones anteriores que ya no se usan (cachés de next)
echo "Borrando caché antigua de .next/cache...\\n";
rrmdir('.next/standalone/.next/cache');
echo "Borrando caché remanente en .next/cache...\\n";
rrmdir('.next/cache');

// 2. Borrar node_modules root si quedó de los intentos no-standalone
echo "Borrando node_modules de la raíz (ya no se usa en standalone)...\\n";
rrmdir('node_modules');

// 3. Archivos ZIP antiguos (incluido este deploy.zip actual)
$zips_to_delete = glob('*.zip');
foreach ($zips_to_delete as $zip) {
    $size = filesize($zip) / 1024 / 1024;
    echo "Borrando $zip (" . round($size, 2) . " MB)...\\n";
    unlink($zip);
}

// 4. Archivos de error y logs sueltos
$logs_to_delete = glob('*.log');
foreach ($logs_to_delete as $log) {
    echo "Borrando $log...\\n";
    unlink($log);
}

// 5. Borrar scripts de prueba antiguos y repetitivos
$scripts_to_delete = [
    'test-local.php', 'test-ms.php', 'test-mysql.js', 'test-ndb.js', 
    'test-ndb.php', 'test-tcp.php', 'test.php', 'check-db.php', 
    'check-db2.php', 'check-deadlock.php', 'check-port.php'
];
foreach ($scripts_to_delete as $script) {
    if (file_exists($script)) {
         echo "Borrando $script...\\n";
         unlink($script);
    }
}

echo "\\n=== ESPACIO DESPUES DE LIMPIEZA PROFUNDA ===\\n";
echo shell_exec("df -h 2>&1");
?>`;
        
        fs.writeFileSync("run-deep-cleanup.php", phpCode);
        await client.uploadFrom("run-deep-cleanup.php", "run-deep-cleanup.php");
        console.log("✅ Script de limpieza profunda subido");
        
    } catch (err: any) {
        console.error("Error al subir:", err.message);
    } finally {
        client.close();
    }
}

deepCleanup();
