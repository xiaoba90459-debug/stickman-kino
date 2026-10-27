#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# CPU renderer/aligner; use the dependency's official switch, keep the session proxy intact.
ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci
python3 -m pip install --only-binary=:all: --target production/.python -r production/requirements-align.txt
if [[ -z "${HYPERFRAMES_BROWSER_PATH:-}" ]]; then
  for candidate in chromium chromium-browser google-chrome; do
    if command -v "$candidate" >/dev/null 2>&1; then
      export HYPERFRAMES_BROWSER_PATH="$(command -v "$candidate")"
      break
    fi
  done
fi
node bin/stickman.mjs setup --no-tts
if [[ "${1:-}" == "--with-tts" ]]; then
  node bin/stickman.mjs setup
fi
printf '%s\n' 'Recorded narration workflow is ready. Optional TTS requires --with-tts and model-download access.'
