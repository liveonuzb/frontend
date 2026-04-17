#!/bin/sh
set -eu

export VITE_API_BASE_URL="${VITE_API_BASE_URL:-}"

envsubst '${VITE_API_BASE_URL}' \
  < /opt/liveon/app-config.template.js \
  > /usr/share/nginx/html/app-config.js
