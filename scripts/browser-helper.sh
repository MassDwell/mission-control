#!/bin/bash
# Browser automation helper - reliable CLI wrapper
# Usage: ./browser-helper.sh <action> [args...]

PROFILE="${BROWSER_PROFILE:-openclaw}"

case "$1" in
  navigate)
    openclaw browser --browser-profile "$PROFILE" navigate "$2"
    ;;
  type)
    # type <ref> <text>
    openclaw browser --browser-profile "$PROFILE" type "$2" "$3"
    ;;
  click)
    openclaw browser --browser-profile "$PROFILE" click "$2"
    ;;
  press)
    openclaw browser --browser-profile "$PROFILE" press "$2"
    ;;
  snapshot)
    openclaw browser --browser-profile "$PROFILE" snapshot --interactive --compact
    ;;
  tabs)
    openclaw browser --browser-profile "$PROFILE" tabs
    ;;
  focus)
    openclaw browser --browser-profile "$PROFILE" focus "$2"
    ;;
  fill)
    # fill <ref> <value> - clicks, clears, and types
    openclaw browser --browser-profile "$PROFILE" click "$2"
    sleep 0.3
    openclaw browser --browser-profile "$PROFILE" press "Control+a"
    sleep 0.1
    openclaw browser --browser-profile "$PROFILE" type "$2" "$3"
    ;;
  search-google)
    # search-google <query> - navigates to google and searches
    openclaw browser --browser-profile "$PROFILE" navigate "https://www.google.com"
    sleep 1
    openclaw browser --browser-profile "$PROFILE" type e9 "$2"
    sleep 0.3
    openclaw browser --browser-profile "$PROFILE" press Enter
    sleep 2
    echo "Search complete"
    ;;
  *)
    echo "Usage: browser-helper.sh <navigate|type|click|press|snapshot|tabs|focus|fill|search-google> [args]"
    exit 1
    ;;
esac
