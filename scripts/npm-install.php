<?php
echo "<h1>Ejecutando npm install...</h1>";
echo "<pre>";
// Intentar ejecutar npm install
$output = shell_exec("npm install 2>&1");
echo $output;
echo "\n--- Fin del proceso ---";
echo "</pre>";
?>
