#!/usr/bin/env bash
# Builds the API Lambda package directory that Terraform zips.
#
# Dependencies are downloaded as prebuilt wheels for Lambda's Linux on arm64,
# not for this machine: cryptography contains compiled code, and a macOS build
# would fail to import on Lambda. boto3 is not bundled; the runtime provides it.
#
# Usage (from the repo root): backend/api/build.sh
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
out="$here/build/package"
python="${PYTHON:-python3}"

rm -rf "$out"
mkdir -p "$out"

"$python" -m pip install \
  --quiet \
  --requirement "$here/requirements.txt" \
  --target "$out" \
  --platform manylinux2014_aarch64 \
  --implementation cp \
  --python-version 3.13 \
  --only-binary=:all:

# Handler modules (no tests) plus the scoring module they import.
for file in "$here"/*.py "$here/../scoring/score.py"; do
  case "$(basename "$file")" in
    test_*.py | conftest.py) ;;
    *) cp "$file" "$out/" ;;
  esac
done

# Drop caches so the zip (and its hash) only changes when the code does.
find "$out" -name "__pycache__" -type d -prune -exec rm -rf {} +

echo "Built $out"
