#!/usr/bin/env bash
set -e

PORT=${1:-9222}
USER_DATA_DIR="$HOME/Library/Application Support/Google/Chrome"
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if curl -s "http://localhost:${PORT}/json/version" > /dev/null 2>&1; then
  echo "Chrome is already running with remote debugging enabled on port ${PORT}."
  exit 0
fi

echo "Launching Google Chrome with remote debugging on port ${PORT}..."

if pgrep -x "Google Chrome" > /dev/null 2>&1; then
  echo "Notice: Google Chrome is currently running without remote debugging enabled."
  echo "macOS requires Chrome to be started with '--remote-debugging-port=${PORT}'."
  echo "To enable remote debugging on your active profile:"
  echo "  1. Quit Google Chrome (Cmd + Q)"
  echo "  2. Relaunch using: open -a \"Google Chrome\" --args --remote-debugging-port=${PORT}"
  echo ""
  echo "Attempting to launch Chrome with remote debugging now..."
fi

# Attempting launch with open -a
open -a "Google Chrome" --args --remote-debugging-port="${PORT}"

sleep 2

if curl -s "http://localhost:${PORT}/json/version" > /dev/null 2>&1; then
  echo "Successfully connected to Chrome CDP on port ${PORT}."
else
  echo ""
  echo "Unable to bind CDP to port ${PORT} because Chrome was already running in non-debug mode."
  echo "Please quit Chrome (Cmd + Q) and run this script again!"
  exit 1
fi
