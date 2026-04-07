#!/bin/sh
cd /Users/studiombc/Desktop/studio-mbc/studio-mbc
mkdir -p /tmp/node-shims
ln -sf /usr/local/bin/node /tmp/node-shims/node
export PATH="/tmp/node-shims:/usr/local/bin:$PATH"
exec /usr/local/bin/node node_modules/next/dist/bin/next dev
