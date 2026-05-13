#!/bin/sh
set -eu

export VITE_API_BASE_URL="${VITE_API_BASE_URL:-}"
export VITE_YANDEX_MAPS_API_KEY="${VITE_YANDEX_MAPS_API_KEY:-}"
export VITE_RUNNING_FEATURE_ENABLED="${VITE_RUNNING_FEATURE_ENABLED:-true}"

envsubst '${VITE_API_BASE_URL} ${VITE_YANDEX_MAPS_API_KEY} ${VITE_RUNNING_FEATURE_ENABLED}' \
  < /opt/liveon/app-config.template.js \
  > /usr/share/nginx/html/app-config.js
