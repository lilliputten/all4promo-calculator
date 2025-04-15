#!/bin/sh
# vim: ft=sh
# @desc Config variables (common version -- stored in repository)
# @changed 2025.04.15, 18:19

if [ -z "$CONFIG_IMPORTED" ]; then

  IS_WINDOWS=`echo "${OS}" | grep -i windows`
  IS_CYGWIN=`uname | grep -i "CYGWIN"`

  # DJANGO_APP="django_app"

  APP_ID=`git ls-remote --get-url | xargs basename -s .git`

  # Project structure setup
  BUILD_FOLDER="dist"
  # PUBLIC_FOLDER="public"
  PUBLISH_FOLDER="publish"
  PUBLISH_BRANCH="publish"
  # DIST_REPO comes from the actual git configuration

  # This file is a project-wide source of truth for version info
  VERSION_FILE="project-version.txt"

  # Misc generated files (see update-build-variables.sh)
  STATIC_FOLDER="src"
  PROJECT_INFO_FILE="$STATIC_FOLDER/project-info.txt"
  PROJECT_HASH_FILE="$STATIC_FOLDER/project-hash.txt"
  # PROJECT_INFO_JSON_FILE="lib/project-info.json"

  SRC_TAG_PREFIX="v" # "v" for default "v.X.Y.Z"

  # Timezone for timestamps (GMT, Europe/Moscow, Asia/Bangkok, Asia/Tashkent, etc)
  TIMEZONE="Europe/Moscow"

  # PYTHON_RUNTIME="python" # See `check-python-env.sh`

  # TODO: To use generic `init-crossplatform-command-names.sh`?
  FINDCMD="find"
  SORTCMD="sort"
  GREPCMD="grep"
  RMCMD="rm"
  DATECMD="date"
  # # Override posix commands for cygwin or/and windows (may be overrided in `config-local.sh`, see `config-local.sh.TEMPLATE`)...
  if [ "$IS_CYGWIN" ]; then
      # Don't use windows' own native commands
      which find_ > /dev/null 2>&1 && FINDCMD="find_"
      which sort_ > /dev/null 2>&1 && SORTCMD="sort_"
      which grep_ > /dev/null 2>&1 && GREPCMD="grep_"
      which rm_ > /dev/null 2>&1 && RMCMD="rm_"
      # which date_ > /dev/null 2>&1 && DATECMD="date_"
  fi

  scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
  test -f "$scriptsPath/config-local.sh" && . "$scriptsPath/config-local.sh"

  CONFIG_IMPORTED=1

fi
