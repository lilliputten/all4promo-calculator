#!/bin/sh
# @desc Create/update version tag (from build folder)
# @changed 2025.03.22, 23:52

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`
prjPath="$rootPath" # `pwd`

# Import config variables (expected variable `$PUBLISH_FOLDER`)...
test -f "$scriptsPath/config.sh" && . "$scriptsPath/config.sh"

# Check basic required variables...
test -f "$rootPath/config-check.sh" && . "$rootPath/config-check.sh"

VERSION=`cat "$rootPath/$VERSION_FILE"`
PROJECT_INFO=`cat "$rootPath/$PROJECT_INFO_FILE"`

echo "Publishing source code $PROJECT_INFO..."

TAG_VALUE="v.$VERSION"
echo "Create/update tag $TAG_VALUE..." \
  && git tag -f "$TAG_VALUE" \
  && git push origin -f --tags \
  && git pull origin \
  && echo "OK"
