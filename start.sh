#!/usr/bin/env bash
# Start both the landing page and the Gradio app together.
set -euo pipefail
cd "$(dirname "$0")"

LANDING_PORT="${LANDING_PORT:-8742}"
APP_PORT="${APP_PORT:-7860}"

port_open() {
  curl -s -o /dev/null --max-time 1 "http://127.0.0.1:$1/" 2>/dev/null
}

if port_open "$APP_PORT"; then
  echo "Gradio already up → http://127.0.0.1:${APP_PORT}"
else
  echo "Starting Gradio on :${APP_PORT} ..."
  PYTHONUNBUFFERED=1 nohup uv run python main.py > /tmp/aiskin-gradio.log 2>&1 &
  echo $! > /tmp/aiskin-gradio.pid
  for i in $(seq 1 30); do
    sleep 1
    if port_open "$APP_PORT"; then
      echo "Gradio up → http://127.0.0.1:${APP_PORT}"
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo "Gradio failed to start. Log: /tmp/aiskin-gradio.log" >&2
      tail -40 /tmp/aiskin-gradio.log >&2 || true
      exit 1
    fi
  done
fi

if port_open "$LANDING_PORT"; then
  echo "Landing already up → http://127.0.0.1:${LANDING_PORT}"
else
  echo "Starting landing on :${LANDING_PORT} ..."
  nohup python3 -m http.server "$LANDING_PORT" --bind 127.0.0.1 \
    > /tmp/aiskin-landing.log 2>&1 &
  echo $! > /tmp/aiskin-landing.pid
  sleep 1
  if port_open "$LANDING_PORT"; then
    echo "Landing up → http://127.0.0.1:${LANDING_PORT}"
  else
    echo "Landing failed to start. Log: /tmp/aiskin-landing.log" >&2
    exit 1
  fi
fi

echo ""
echo "Open the landing page:  http://127.0.0.1:${LANDING_PORT}"
echo "Get Started opens the app: http://127.0.0.1:${APP_PORT}"
