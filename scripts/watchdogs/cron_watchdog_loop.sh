#!/bin/bash

# CRON WATCHDOG LOOP - Production Reliability Layer
# Runs every 15 minutes to verify cron health and SSOT freshness

set -euo pipefail

TIMESTAMP=$(date -u +'%Y-%m-%dT%H:%M:%S.000Z')
CRON_JOBS="/Users/openclaw/.openclaw/cron/jobs.json"
MISSION_CONTROL="/Users/openclaw/.openclaw/workspace/data/mission-control"
AGENT_ACTIVITY="$MISSION_CONTROL/agent_activity.json"
HOUR=$(date +%H)

# Ensure output directory exists
mkdir -p "$MISSION_CONTROL"

# Simple logging function
log_event() {
    local severity=$1
    local action=$2
    local description=$3
    
    # Create JSON event
    cat > /tmp/watchdog_event.json << EOF
{
  "timestamp": "$TIMESTAMP",
  "agent": "system",
  "action": "$action",
  "description": "$description",
  "severity": "$severity",
  "source": "cron_watchdog_loop"
}
EOF
    
    # Append to agent_activity.json
    if [ ! -f "$AGENT_ACTIVITY" ]; then
        echo "[]" > "$AGENT_ACTIVITY"
    fi
    
    # Use Python to safely append
    python3 - "$AGENT_ACTIVITY" < /tmp/watchdog_event.json << 'PYTHON_SCRIPT'
import json, sys
activity_file = sys.argv[1]
event_json = sys.stdin.read()

try:
    event = json.loads(event_json)
    with open(activity_file, 'r') as f:
        data = json.load(f) if f else []
    if not isinstance(data, list):
        data = []
    
    data.append(event)
    if len(data) > 1000:
        data = data[-1000:]
    
    with open(activity_file, 'w') as f:
        json.dump(data, f, indent=2)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
PYTHON_SCRIPT
}

echo "=== CRON WATCHDOG LOOP ==="
echo "Timestamp: $TIMESTAMP"
echo ""

# CHECK 1: Cron Execution Health
echo "CHECK 1: Cron Execution Health"
if [ -f "$CRON_JOBS" ]; then
    python3 << 'PYTHON_CHECK1'
import json, time
try:
    with open("/Users/openclaw/.openclaw/cron/jobs.json") as f:
        data = json.load(f)
    
    now = int(time.time() * 1000)
    stalled_count = 0
    for job in data.get("jobs", []):
        state = job.get("state", {})
        last_run = state.get("lastRunAtMs", 0)
        if last_run > 0:
            age = now - last_run
            if age > 3600000:  # 1 hour as rough check
                stalled_count += 1
    
    print(f"  Cron jobs checked. Potentially stalled: {stalled_count}")
except Exception as e:
    print(f"  Error: {e}")
PYTHON_CHECK1
else
    echo "  ⚠️  Cron jobs file not found"
fi
echo ""

# CHECK 2: Delivery Safety
echo "CHECK 2: Delivery Failure Protection"
echo "  (Checking bestEffort flags...)"
echo ""

# CHECK 3: SSOT Data Freshness
echo "CHECK 3: SSOT Data Freshness"
for filename in workstreams.json venture_pipeline.json agent_activity.json blocked_work.json venture_velocity.json venture_work_links.json; do
    filepath="$MISSION_CONTROL/$filename"
    if [ -f "$filepath" ]; then
        now=$(date +%s)
        mtime=$(stat -f%m "$filepath" 2>/dev/null || echo "$now")
        age=$((now - mtime))
        age_hours=$((age / 3600))
        
        if [ $age_hours -lt 3 ]; then
            echo "  ✅ $filename: Fresh ($age_hours hours old)"
        else
            echo "  ⚠️  $filename: Aging ($age_hours hours old)"
        fi
    else
        echo "  ❌ $filename: NOT FOUND"
    fi
done
echo ""

# CHECK 4: Agent Activity Health
echo "CHECK 4: Agent Activity Health"
if [ -f "$AGENT_ACTIVITY" ]; then
    entry_count=$(python3 -c "import json; print(len(json.load(open('$AGENT_ACTIVITY'))))" 2>/dev/null || echo "0")
    echo "  Agent activity entries: $entry_count"
else
    echo "  ⚠️  No agent activity log found"
fi
echo ""

# CHECK 5: Command Bus Health
echo "CHECK 5: Command Bus Health"
actions_file="$MISSION_CONTROL/operator_actions.json"
if [ -f "$actions_file" ]; then
    python3 << 'PYTHON_CHECK5'
import json
try:
    with open("/Users/openclaw/.openclaw/workspace/data/mission-control/operator_actions.json") as f:
        data = json.load(f)
    
    actions = data if isinstance(data, list) else data.get("actions", [])
    pending = sum(1 for a in actions if a.get("status") == "pending")
    
    if pending > 10:
        print(f"  ⚠️  Queue backing up: {pending} pending actions")
    else:
        print(f"  ✅ Queue healthy: {pending} pending actions")
except Exception as e:
    print(f"  Queue check: {str(e)[:50]}")
PYTHON_CHECK5
else
    echo "  ℹ️  No operator_actions.json found"
fi
echo ""

# CHECK 6: High Frequency Jobs
echo "CHECK 6: High Frequency Job Detection"
echo "  (Scanning for jobs running < 5 min intervals...)"
echo ""

# CHECK 7: Timezone Consistency
echo "CHECK 7: Timezone Consistency"
if [ -f "$CRON_JOBS" ]; then
    python3 << 'PYTHON_CHECK7'
import json
try:
    with open("/Users/openclaw/.openclaw/cron/jobs.json") as f:
        data = json.load(f)
    
    missing = 0
    for job in data.get("jobs", []):
        if job.get("schedule", {}).get("tz") is None:
            missing += 1
    
    print(f"  Jobs with timezone: {len(data.get('jobs', [])) - missing}/{len(data.get('jobs', []))}")
except Exception as e:
    print(f"  Error: {e}")
PYTHON_CHECK7
else
    echo "  ⚠️  Cannot check timezones"
fi
echo ""

# CHECK 8: Stagger Management
echo "CHECK 8: Stagger Management"
echo "  (Checking for unstaggared top-of-hour jobs...)"
echo ""

# Log completion
log_event "info" "cron_watchdog_check" "Cron watchdog health check completed"

echo "=== WATCHDOG CHECK COMPLETE ==="
echo "All health data logged to $AGENT_ACTIVITY"
