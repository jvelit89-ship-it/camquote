<?php
$zipFile = 'deploy.zip';
$extractPath = './';

if (!file_exists($zipFile)) {
    die("Error: No se encontró el archivo $zipFile");
}

$zip = new ZipArchive;
if ($zip->open($zipFile) === TRUE) {
    if ($zip->extractTo($extractPath)) {
        echo "✅ Archivos extraídos con éxito en $extractPath\n";
    } else {
        echo "❌ Error al extraer los archivos.\n";
    }
    $zip->close();
} else {
    echo "❌ No se pudo abrir el archivo ZIP.\n";
}

// Opcionalmente eliminar el zip después de extraer
// unlink($zipFile);
?>
