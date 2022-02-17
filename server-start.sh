#!/usr/bin/env bash
# start-server.sh

( uvicorn voteme.asgi:application --host 0.0.0.0 --port 8000 ) &
nginx -g "daemon off;"