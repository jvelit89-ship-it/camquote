<?php
echo "=== REPARANDO RUTAS ESTATICAS Y PUBLICAS ===\n";

// 1. Mover contenido de public/ a la raíz
if (is_dir('public')) {
    echo "Moviendo archivos de public/ a la raíz...\n";
    $files = scandir('public');
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            rename("public/$file", $file);
            echo "Movido: $file\n";
        }
    }
}

// 2. Crear symlink o directorio para _next/static
if (!is_dir('_next')) {
    mkdir('_next');
}

if (!is_dir('_next/static') && is_dir('.next/static')) {
    echo "Copiando .next/static a _next/static...\n";
    shell_exec('cp -r .next/static _next/');
    echo "Copiado.\n";
}

echo "OK. Reparación completada.\n";
?>
