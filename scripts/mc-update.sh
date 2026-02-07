#!/bin/bash
# Mission Control Task Update Script
# Usage: mc-update.sh <command> <task_id> [args...]

set -e

WORKSPACE="/Users/openclaw/.openclaw/workspace"
TASKS_FILE="$WORKSPACE/data/tasks.json"

cd "$WORKSPACE"

case "$1" in
    start)
        TASK_ID="$2"
        AGENT="${3:-Clawson}"
        
        if [[ -z "$TASK_ID" ]]; then
            echo "Usage: mc-update.sh start <task_id> [agent_name]"
            exit 1
        fi
        
        python3 << PYEOF
import json
from datetime import datetime
with open('$TASKS_FILE', 'r', encoding='utf-8') as f:
    data = json.load(f)
found = False
for t in data['tasks']:
    if t['id'] == '$TASK_ID':
        now = datetime.utcnow().isoformat() + 'Z'
        t['processingStartedAt'] = now
        t['processingAgent'] = '$AGENT'
        found = True
        print(f"✓ {t['title']}: 🟢 ACTIVE ({t.get('processingAgent', 'unknown')})")
        break
if not found:
    print(f"✗ Task '$TASK_ID' not found")
    exit(1)
data['lastUpdated'] = datetime.utcnow().isoformat() + 'Z'
with open('$TASKS_FILE', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
PYEOF
        ;;
        
    stop)
        TASK_ID="$2"
        
        if [[ -z "$TASK_ID" ]]; then
            echo "Usage: mc-update.sh stop <task_id>"
            exit 1
        fi
        
        python3 << PYEOF
import json
from datetime import datetime
with open('$TASKS_FILE', 'r', encoding='utf-8') as f:
    data = json.load(f)
found = False
for t in data['tasks']:
    if t['id'] == '$TASK_ID':
        t.pop('processingStartedAt', None)
        t.pop('processingAgent', None)
        found = True
        print(f"✓ {t['title']}: ⚪ IDLE")
        break
if not found:
    print(f"✗ Task '$TASK_ID' not found")
    exit(1)
data['lastUpdated'] = datetime.utcnow().isoformat() + 'Z'
with open('$TASKS_FILE', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
PYEOF
        ;;
        
    complete)
        TASK_ID="$2"
        SUMMARY="$3"
        AGENT="${4:-Clawson}"
        
        python3 << PYEOF
import json
from datetime import datetime
with open('$TASKS_FILE', 'r', encoding='utf-8') as f:
    data = json.load(f)
found = False
for t in data['tasks']:
    if t['id'] == '$TASK_ID':
        t['status'] = 'review'
        t.pop('processingStartedAt', None)
        t.pop('processingAgent', None)
        if 'comments' not in t:
            t['comments'] = []
        t['comments'].append({
            'author': '$AGENT',
            'text': '''$SUMMARY''',
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
        found = True
        print(f"✓ {t['title']}: → review")
        break
if not found:
    print(f"✗ Task '$TASK_ID' not found")
    exit(1)
data['lastUpdated'] = datetime.utcnow().isoformat() + 'Z'
with open('$TASKS_FILE', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
PYEOF
        ;;

    status)
        python3 << PYEOF
import json
from datetime import datetime
with open('$TASKS_FILE', 'r', encoding='utf-8') as f:
    data = json.load(f)
print("MISSION CONTROL STATUS")
print("=" * 50)
for t in data['tasks']:
    if t['status'] in ['in_progress', 'permanent']:
        active = '🟢 ACTIVE' if t.get('processingStartedAt') else '⚪ IDLE'
        agent = t.get('processingAgent', '-')
        print(f"{t['id']}: {active} | {agent} | {t['title'][:40]}")
PYEOF
        ;;
        
    *)
        echo "mc-update.sh — Mission Control CLI"
        echo ""
        echo "Commands:"
        echo "  start <task_id> [agent]  - Mark task as active (shows green)"
        echo "  stop <task_id>           - Mark task as idle"
        echo "  complete <task_id> \"summary\" [agent] - Move to review"
        echo "  status                   - Show all active tasks"
        ;;
esac
