<?php
function deleteRecursive($dir) {
    if (!file_exists($dir)) return true;
    if (!is_dir($dir)) return unlink($dir);
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') continue;
        if ($item == 'delete-garbage.php') continue;
        if (!deleteRecursive($dir . DIRECTORY_SEPARATOR . $item)) return false;
    }
    return rmdir($dir);
}

$currentDir = __DIR__;
echo "🧹 Iniciando limpieza en $currentDir...\n";

foreach (scandir($currentDir) as $item) {
    if ($item == '.' || $item == '..') continue;
    if ($item == 'delete-garbage.php') continue;
    
    $path = $currentDir . DIRECTORY_SEPARATOR . $item;
    if (is_dir($path)) {
        if (deleteRecursive($path)) {
            echo "✅ Eliminado directorio: $item\n";
        } else {
            echo "❌ Error al eliminar directorio: $item\n";
        }
    } else {
        if (unlink($path)) {
            echo "✅ Eliminado archivo: $item\n";
        } else {
            echo "❌ Error al eliminar archivo: $item\n";
        }
    }
}

echo "✨ Limpieza completada.\n";
?>
