#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
cd "/Users/rahulgupta/Desktop/Agent Edu/frontend" || exit 1
exec /opt/homebrew/bin/node server.js
