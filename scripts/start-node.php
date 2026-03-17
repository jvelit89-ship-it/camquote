<?php
echo "<h1>Ejecutando servidor de forma manual (Background)...</h1>";
echo "<pre>";

// Script para matar cualquier proceso de node previo corriendo en nuestro puerto y arrancar el nuestro
$script = <<<EOT
#!/bin/bash
# Matar procesos de node previos (precaución extrema, idealmente usar pkill -f server.js)
pkill -f "node server.js" || true
# Configurar variables de entorno y lanzar server.js en segundo plano
export PORT=3000
export HOST=127.0.0.1
nohup public_html/bin/node server.js > server.log 2>&1 &
echo "Servidor lanzado con PID $!"
EOT;

file_put_contents('start-server.sh', $script);
chmod('start-server.sh', 0755);

$output = shell_exec("./start-server.sh 2>&1");
echo $output;

echo "\n--- Fin del proceso ---";
echo "</pre>";
?>
