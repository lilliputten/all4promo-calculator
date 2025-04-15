#!/bin/sh
# @desc Initialize python venv
# @changed 2024.12.02, 02:34

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`

# Import config variables...
test -f "$scriptsPath/config.sh" && . "$scriptsPath/config.sh"

# Global system requirements...
pip install setuptools virtualenv
# Create venv...
# python -m virtualenv -p "$PYTHON_RUNTIME" .venv
python -m virtualenv .venv
# Activate venv
. ./.venv/Scripts/activate
# Install project dependencies...
pip install -r requirements-general.txt -r requirements-dev-only.txt
# User info...
echo "Use next command to activate venv: '. ./.venv/Scripts/activate'"
echo "Or for windows: 'call .venv/Scripts/activate'"

