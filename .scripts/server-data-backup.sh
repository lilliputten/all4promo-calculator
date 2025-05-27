#!/bin/sh
# @changed 2025.04.29, 03:12
# @desc Create a data backup on a thin server

scriptsPath=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
rootPath=`dirname "$scriptsPath"`
utilsPath="$rootPath/.utils"

# Import config variables...
test -f "$utilsPath/config.sh" && . "$utilsPath/config.sh"

if [ -f "data/data.json" ]; then
  TIMETAG=`date +%y%m%d-%H%M`
  cp -vf "$rootPath/data/data.json" "$rootPath/data/backup-${TIMETAG}-data.json"
fi
