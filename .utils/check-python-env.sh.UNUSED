#!/bin/sh
# @desc Check if run under .venv environment
# @changed 2025.01.02, 23:07

if [ -z "$CHECKED_PYTHON_ENV" ]; then
  # Already checked: check only once

  PYTHON_RUNTIME=`which python`

  echo "$PYTHON_RUNTIME" | grep -q ".venv"

  if [ $? = 1 ]; then
    # Is poetry exists?
    if which poetry > /dev/null 2>&1; then
      echo "check-python-env: Using poetry"
      PYTHON_RUNTIME="poetry run python"
    else
      echo "check-python-env: ERROR: No .venv or poetry found!"
      exit 1
    fi
  else
    echo "check-python-env: Using .venv"
  fi

  if [ -z "$DJANGO_APP" ]; then
    echo "Django application isn't specified. See 'DJANGO_APP' parameter in 'config.sh'"
    exit 1
  fi

  CHECKED_PYTHON_ENV=1
fi
