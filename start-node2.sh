#!/bin/bash
export NODE_ENV=production
export PORT=3000
export HOSTNAME=127.0.0.1
exec /home3/camquote/public_html/node_local/bin/node next-server.js
