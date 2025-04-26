#!/bin/sh
# @changed 2025.04.03, 01:47

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`
utilsPath="$rootPath/.utils"

# Import config variables...
test -f "$utilsPath/config.sh" && . "$utilsPath/config.sh"

if [ -f "$rootPath/public/data/data.json" ]; then
  TIMETAG=`$DATECMD +%y%m%d-%H%M`
  cp -vf "$rootPath/public/data/data.json" "$rootPath/public/data/backup-${TIMETAG}-data.json"
fi
if [ -f "$rootPath/data/data.json" ]; then
  TIMETAG=`$DATECMD +%y%m%d-%H%M`
  cp -vf "$rootPath/data/data.json" "$rootPath/data/backup-${TIMETAG}-data.json"
fi
