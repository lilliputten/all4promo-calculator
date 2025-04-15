#!/bin/sh
# @desc Create/update version tag (from build folder)
# @changed 2025.01.03, 19:30

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`
prjPath="$rootPath" # `pwd`

# Import config variables (expected variable `$PUBLISH_FOLDER`)...
test -f "$scriptsPath/config.sh" && . "$scriptsPath/config.sh"

# Check basic required variables...
test -f "$rootPath/config-check.sh" && . "$rootPath/config-check.sh"

# Console command:
# date_ "+%Y.%m.%d-%H:%M:%S" > test.stamp && git add . -Av && git commit -am "Deploy test `cat test.stamp`" && git push && cat test.stamp

touch "$rootPath/project-version.txt" \
  && . "$scriptsPath/update-build-variables.sh" \
  && cp "$rootPath/$PROJECT_INFO_FILE" "$rootPath/.deploy.stamp"

PROJECT_INFO=`cat "$rootPath/$PROJECT_INFO_FILE"`

echo "Creating test deploy $PROJECT_INFO" \
  && git add . -Av \
  && git commit -am "Deploy test $PROJECT_INFO" \
  && git push \
  && cat .deploy.stamp \
  && echo "Created test deploy: $PROJECT_INFO"
