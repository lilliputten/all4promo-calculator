#!/bin/sh
# @desc Clean all temp files
# @changed 2025.03.25, 23:01

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`
prjPath="$rootPath" # `pwd`

# Import config variables (expected variables `$DIST_REPO` and `$PUBLISH_FOLDER`)...
test -f "$scriptsPath/config.sh" && . "$scriptsPath/config.sh"

echo "Clearing the root folder..."
$RMCMD -Rf \
  static/CACHE \
  media/CACHE \
  __pycache__ \
  build \
  .handler-saves \
  node_modules/.cache \
  .state-save \
  local.log* \
  *.log \
  log-* \
  *.py[co] \
  .*sw[op] \
  2> /dev/null

echo "Emptying temp files recursively..."
$FINDCMD . \
  -not \( -name '.git' -prune \) \
  -not \( -name '.vscode' -prune \) \
  -not \( -name '.next' -prune \) \
  -not \( -name '.venv*' -prune \) \
  -not \( -name 'out' -prune \) \
  -not \( -name 'build*' -prune \) \
  -not \( -name '*UNUSED' -prune \) \
  -not \( -name 'publish*' -prune \) \
  -not \( -name 'node_modules' -prune \) \
  \( \
    -name '*_' \
    -name '*~' \
    -o -name '*.py[co]' \
    -o -name '.*sw[op]' \
    -o -name '*.bak' \
    -o -name '*.tmp' \
    -o -name '*.log' \
    -o -name '__pycache__' \
  \) \
  -exec $RMCMD -Rvf {} 2> /dev/null \;

echo "Removing empty folders..."
$FINDCMD . \( \
  -not \( -name '.git' -prune \) \
  -not \( -name '.vscode' -prune \) \
  -not \( -name '.next' -prune \) \
  -not \( -name '.venv*' -prune \) \
  -not \( -name 'out' -prune \) \
  -not \( -name 'build*' -prune \) \
  -not \( -name '*UNUSED' -prune \) \
  -not \( -name 'publish*' -prune \) \
  -not \( -name 'node_modules' -prune \) \
  -type d -empty \
  \) \
  -exec $RMCMD -Rvf {} 2> /dev/null \;

echo OK
