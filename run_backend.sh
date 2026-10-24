#!/bin/bash
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
cd "/Users/rahulgupta/Desktop/Agent Edu/backend" || exit 1
export PYTHONPATH="/Users/rahulgupta/Desktop/Agent Edu/backend"
export PYTHONUNBUFFERED=1
exec "/Users/rahulgupta/Desktop/Agent Edu/.venv/bin/python" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
