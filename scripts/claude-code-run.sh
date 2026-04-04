#!/usr/bin/env bash
# claude-code-run.sh — Claude Code wrapper
#
# Usage:
#   claude-code-run.sh <task_id> <workflow_type> <objective> [claude args...]
#
# Example:
#   claude-code-run.sh "pr-147-rebase" "code" "Rebase audit log branch on main" \
#     --permission-mode bypassPermissions --print 'resolve conflicts...'

set -uo pipefail

TASK_ID="${1:?task_id required}"
WORKFLOW_TYPE="${2:?workflow_type required}"
OBJECTIVE="${3:?objective required}"
shift 3

START_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "[claude-code-run] START task_id=$TASK_ID objective='$OBJECTIVE'"

EXIT_CODE=0
claude "$@" || EXIT_CODE=$?

END_TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [ "$EXIT_CODE" -eq 0 ]; then
  TERMINAL_STATE="completed"
else
  TERMINAL_STATE="failed"
fi

echo "[claude-code-run] DONE task_id=$TASK_ID state=$TERMINAL_STATE exit=$EXIT_CODE"
exit "$EXIT_CODE"
