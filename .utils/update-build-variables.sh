#!/bin/sh
# @desc Update version number & build timestamps
# @changed 2025.03.13, 22:11

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`
prjPath="$rootPath" # `pwd`

# Import config variables...
test -f "$scriptsPath/config.sh" && . "$scriptsPath/config.sh"

# # Check basic required variables...
# test -f "$rootPath/config-check.sh" && . "$rootPath/config-check.sh"

# Read (and derive) variables from changed files...
VERSION_PATH="$rootPath/${VERSION_FILE}"
VERSION=`cat "$VERSION_PATH"`
TIMESTAMP=`$DATECMD -r "$VERSION_PATH" "+%Y.%m.%d %H:%M:%S %z"`
TIMETAG=`$DATECMD -r "$VERSION_PATH" "+%y%m%d-%H%M"`

# APP_ID=`cat "$rootPath/$APP_ID_FILE"`

PROJECT_INFO="$APP_ID v.$VERSION / $TIMESTAMP"
PROJECT_INFO_REP=`echo "$PROJECT_INFO" | sed 's,/,\\\\/,g'` # Quoted for replace, see below
PROJECT_HASH="v.$VERSION-$TIMETAG"

echo "Updated project info: $PROJECT_INFO"

if [ ! -z "${PROJECT_INFO_FILE}" ]; then
  echo "Creating '$PROJECT_INFO_FILE' file..."
  echo "$PROJECT_INFO" > $rootPath/$PROJECT_INFO_FILE
fi

if [ ! -z "${PROJECT_HASH_FILE}" ]; then
  echo "Creating '$PROJECT_HASH_FILE' file..."
  echo "$PROJECT_HASH" > $rootPath/$PROJECT_HASH_FILE
fi


if [ ! -z "${PROJECT_INFO_JSON_FILE}" ]; then
  echo "Creating '$PROJECT_INFO_JSON_FILE' file..."
  echo "{ \"projectInfo\": \"$PROJECT_INFO\" }" > $rootPath/$PROJECT_INFO_JSON_FILE
fi

UPDATE_FILE() {
  FILE=$1
  if [ ! -f $FILE ]; then
    # echo "File $FILE doesn't exists"
    return
  fi
  NAME="${FILE##*/}" # Exract file name
  EXT="${NAME##*.}" # Exract extension
  echo "Updating file $NAME ($FILE)..."
  mv $FILE $FILE.bak || exit 1
  # # TODO: Replace only first occurence of `version`
  if [ "$NAME" = "package-lock.json" ]; then # package-lock
    # NOTE: Update only first occurenece of verion parameter in package-lock...
    echo "package-lock.json"
    cat $FILE.bak \
      | sed "0,/\(\"version\":\) \".*\"/{s//\1 \"$VERSION\"/}" \
    > $FILE || exit 1
  elif [ "$EXT" = "json" ]; then # JSON
    cat $FILE.bak \
      | sed "s/\(\"version\":\) \".*\"/\1 \"$VERSION\"/" \
      | sed "s/\(\"timestamp\":\) \".*\"/\1 \"$TIMESTAMP\"/" \
      | sed "s/\(\"timetag\":\) \".*\"/\1 \"$TIMETAG\"/" \
    > $FILE || exit 1
  elif [ "$EXT" = "yaml" ]; then # env.local files
    cat $FILE.bak \
      | sed "s/\(version:\s*\)\([\"']\).*\2/\1\2$VERSION\2/" \
      | sed "s/\(timestamp:\s*\)\([\"']\).*\2/\1\2$TIMESTAMP\2/" \
      | sed "s/\(timetag:\s*\)\([\"']\).*\2/\1\2$TIMETAG\2/" \
    > $FILE || exit 1
  elif [ "$EXT" = "toml" -o "$EXT" = "gradle" ]; then # Python
    cat $FILE.bak \
      | sed "s/\(^\s*version\s*=\s*\)\([\"']\).*\2/\1\2$VERSION\2/" \
      | sed "s/\(^\s*timestamp\s*=\s*\)\([\"']\).*\2/\1\2$TIMESTAMP\2/" \
      | sed "s/\(^\s*timetag\s*=\s*\)\([\"']\).*\2/\1\2$TIMETAG\2/" \
    > $FILE || exit 1
  elif [ "$EXT" = "py" ]; then # Python
    cat $FILE.bak \
      | sed "s/\(__version__ =\) \([\"']\).*\2/\1 \2$VERSION\2/" \
      | sed "s/\(__timestamp__ =\) \([\"']\).*\2/\1 \2$TIMESTAMP\2/" \
      | sed "s/\(__timetag__ =\) \([\"']\).*\2/\1 \2$TIMETAG\2/" \
    > $FILE || exit 1
  elif [ "$EXT" = "html" ]; then # HTML: Replace data in meta tags
    cat $FILE.bak \
      | sed "s/\(project-info\" content=\)\([\"']\).*\2/\1 \2$PROJECT_INFO_REP\2/" \
      | sed "s/\(version\" content=\)\([\"']\).*\2/\1 \2$VERSION\2/" \
      | sed "s/\(timestamp\" content=\)\([\"']\).*\2/\1 \2$TIMESTAMP\2/" \
      | sed "s/\(timestag\" content=\)\([\"']\).*\2/\1 \2$TIMESTAG\2/" \
    > $FILE || exit 1
  elif [ "$NAME" = ".env" ]; then # .env files
    cat $FILE.bak \
      | sed "s/\(version\s*=\)\s*\".*\"/\1\"$VERSION\"/" \
      | sed "s/\(timestamp\s*=\)\s*\".*\"/\1\"$TIMESTAMP\"/" \
      | sed "s/\(timetag\s*=\)\s*\".*\"/\1\"$TIMETAG\"/" \
    > $FILE || exit 1
  else # Other free format files (md, django, etc)...
    cat $FILE.bak \
      | sed "s/\(Project info:\) .*$/\1 $PROJECT_INFO_REP/" \
      | sed "s/\(Version:\) .*$/\1 $VERSION/" \
      | sed "s/\(Last changes timestamp:\) .*$/\1 $TIMESTAMP/" \
      | sed "s/\(Last changes timetag:\) .*$/\1 $TIMETAG/" \
    > $FILE || exit 1
  fi
  rm $FILE.bak || exit 1
}

UPDATE_FILE "$prjPath/pubspec.yaml"
UPDATE_FILE "$prjPath/android/app/build.gradle"
UPDATE_FILE "$prjPath/.env.local" # TODO: Use '.env*'
UPDATE_FILE "$prjPath/package.json"
UPDATE_FILE "$prjPath/pyproject.toml"
UPDATE_FILE "$prjPath/package-lock.json"
UPDATE_FILE "$prjPath/README.md"
UPDATE_FILE "$prjPath/public/index.html"
UPDATE_FILE "$prjPath/tales_django/templates/base-core.html.django"
