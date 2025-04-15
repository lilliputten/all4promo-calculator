#!/bin/sh
# @desc Increment version number
# @changed 2024.12.02, 12:54

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`
prjPath="$rootPath" # `pwd`

# Import config variables...
test -f "$scriptsPath/config.sh" && . "$scriptsPath/config.sh"

# Check basic required variables...
test -f "$rootPath/config-check.sh" && . "$rootPath/config-check.sh" --omit-publish-folder-check

# Read version from file...
VERSION_PATH="$rootPath/${VERSION_FILE}"
BACKUP="$VERSION_PATH.bak"

NEXT_PATCH_NUMBER="0"

if [ ! -f "$VERSION_PATH" ]; then
  echo "NO PREVIOUS VERSION INFO!"
  echo "0.0.0" > "$VERSION_PATH"
else
  PATCH_NUMBER=`cat "$VERSION_PATH" | sed "s/^\(.*\)\.\([0-9]\+\)$/\2/"`
  # Increment patch number
  NEXT_PATCH_NUMBER=`expr $PATCH_NUMBER + 1`
fi

cp "$VERSION_PATH" "$BACKUP" \
  && cat "$BACKUP" \
    | sed "s/^\(.*\)\.\([0-9]\+\)$/\1.$NEXT_PATCH_NUMBER/" \
    > "$VERSION_PATH" \
  && rm "$BACKUP" \
  && echo "Updated version: `cat $VERSION_PATH`" \
  && sh "$scriptsPath/update-build-variables.sh" \
  && VERSION=`cat "$VERSION_PATH"` \
  && echo "Done"
