#!/bin/sh
# @desc Update publish folder (prepare remote update)
# @changed 2025.04.27, 22:00

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`
prjPath="$rootPath" # `pwd`

# Import config variables (expected variable `$PUBLISH_FOLDER`)...
test -f "$scriptsPath/config.sh" && . "$scriptsPath/config.sh"

# Check basic required variables...
test -f "$rootPath/config-check.sh" && . "$rootPath/config-check.sh"

# Make build if it's absent
test -d "$BUILD_FOLDER" || npm run -s build || exit 1

echo "Updating publish folder '$PUBLISH_FOLDER' from build folder '$BUILD_FOLDER'..."

cd "$PUBLISH_FOLDER" && \
  echo "Working folder is: `pwd`" && \
  rm -Rf * && \
  (test -z "$PUBLIC_FOLDER" || test ! -d "../$PUBLIC_FOLDER" || ( \
    (test -z "`compgen -G \"../$PUBLIC_FOLDER/.*\"`" || ( cp -Rfu ../$PUBLIC_FOLDER/.[^.]* . && echo "Copied dot files from the public folder" ) ) && \
    cp -Rfu ../$PUBLIC_FOLDER/* . && echo "Copied regular files from the public folder" ) ) && \
  (test -z "$BUILD_FOLDER" || test ! -d "../$BUILD_FOLDER" || ( \
    (test -z "`compgen -G \"../$BUILD_FOLDER/.*\"`" || ( cp -Rfu ../$BUILD_FOLDER/.[^.]* . && echo "Copied dot files from the build folder" ) ) && \
    cp -Rfu ../$BUILD_FOLDER/* . && echo "Copied regular files from the build folder" ) ) && \
    mv -vf data/data.json data/data-sample.json && \
  cd .. && \
  echo OK
