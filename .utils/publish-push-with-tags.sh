#!/bin/sh
# @desc Push only tags
# @changed 2024.12.11, 03:44

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`
prjPath="$rootPath" # `pwd`

# Import config variables (expected variable `$PUBLISH_FOLDER`)...
test -f "$scriptsPath/config.sh" && . "$scriptsPath/config.sh"

# Check basic required variables...
test -f "$rootPath/config-check.sh" && . "$rootPath/config-check.sh"

# Make build if absent
sh "$scriptsPath/publish-update.sh" || exit 1

VERSION=`cat "$rootPath/$VERSION_FILE"`
PROJECT_INFO=`cat "$rootPath/$PROJECT_INFO_FILE"`

echo "Publishing build $PROJECT_INFO..."

TAG_VALUE="$PUBLISH_BRANCH.$VERSION"
COMMIT_TEXT="Build $TAG_VALUE, $TIMESTAMP ($TIMETAG)"
cd "$PUBLISH_FOLDER" && \
  echo "Create/update tag $TAG_VALUE..." && git tag -f -am "$COMMIT_TEXT" "$TAG_VALUE" && \
  echo "Push tagged branch with tags..." && git push -f --tags && git pull && \
  echo "Done" && cd ..

