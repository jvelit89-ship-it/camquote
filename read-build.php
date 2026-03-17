<?php
echo "=== DISK SPACE ===
";
echo shell_exec("df -h 2>&1");

echo "
=== BUILD ID CONTENT ===
";
echo @file_get_contents(".next/BUILD_ID");

echo "
=== CHUNKS DIR ===
";
echo shell_exec("ls -la .next/server/chunks/ 2>&1");
?>