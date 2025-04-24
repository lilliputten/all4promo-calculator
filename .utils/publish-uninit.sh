#!/bin/sh
# @desc Initialize publish syncing repository
# @changed 2024.12.11, 02:49

# NOTE: For uninstall/reinitialize publish submodule, use:
# ```shell
# rm -Rf publish .gitmodules .git/modules/publish
# ```

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`
prjPath="$rootPath" # `pwd`

# Import config variables (expected variable `$PUBLISH_FOLDER`)...
test -f "$scriptsPath/config.sh" && . "$scriptsPath/config.sh"

# Check basic required variables...
test -f "$rootPath/config-check.sh" && . "$rootPath/config-check.sh"

if [ -z "$PUBLISH_FOLDER" ]; then
  echo "Publish folder hasn't been specified. See 'PUBLISH_FOLDER' parameter in 'config.sh'"
  exit 1
fi

echo "Uninitializing publish folder & submodule for '$PUBLISH_FOLDER'..."

rm -Rf "$PUBLISH_FOLDER" .gitmodules ".git/modules/$PUBLISH_FOLDER" && \
  echo Ok
