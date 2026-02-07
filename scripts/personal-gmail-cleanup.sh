#!/bin/bash
# Personal Gmail Cleanup Script
# Cleans: Promotions, Social, Spam, Newsletters
# Account: vettoristeve@gmail.com

ACCOUNT="vettoristeve@gmail.com"
LOG_FILE="/tmp/gmail-cleanup.log"

echo "$(date): Starting Gmail cleanup for $ACCOUNT" >> "$LOG_FILE"

# Function to archive threads (remove from inbox)
archive_threads() {
    local query="$1"
    local label="$2"
    
    echo "$(date): Searching for: $query" >> "$LOG_FILE"
    
    # Get thread IDs
    threads=$(gog gmail search "$query" --account "$ACCOUNT" --max 50 --json --no-input 2>/dev/null | jq -r '.[].threadId' 2>/dev/null)
    
    if [ -z "$threads" ]; then
        echo "$(date): No threads found for $label" >> "$LOG_FILE"
        return
    fi
    
    count=0
    for thread_id in $threads; do
        # Remove INBOX label (archive) and optionally add TRASH
        gog gmail thread modify "$thread_id" --account "$ACCOUNT" --remove "INBOX" --force --no-input 2>/dev/null
        ((count++))
    done
    
    echo "$(date): Archived $count threads for $label" >> "$LOG_FILE"
}

# Function to trash threads
trash_threads() {
    local query="$1"
    local label="$2"
    
    echo "$(date): Searching for: $query" >> "$LOG_FILE"
    
    # Get thread IDs
    threads=$(gog gmail search "$query" --account "$ACCOUNT" --max 50 --json --no-input 2>/dev/null | jq -r '.[].threadId' 2>/dev/null)
    
    if [ -z "$threads" ]; then
        echo "$(date): No threads found for $label" >> "$LOG_FILE"
        return
    fi
    
    count=0
    for thread_id in $threads; do
        # Add TRASH label
        gog gmail thread modify "$thread_id" --account "$ACCOUNT" --remove "INBOX" --add "TRASH" --force --no-input 2>/dev/null
        ((count++))
    done
    
    echo "$(date): Trashed $count threads for $label" >> "$LOG_FILE"
}

# 1. Clean Promotions (in inbox, category:promotions)
trash_threads "in:inbox category:promotions" "Promotions"

# 2. Clean Social notifications
trash_threads "in:inbox category:social" "Social"

# 3. Clean Updates/Notifications
trash_threads "in:inbox category:updates" "Updates"

# 4. Clean common newsletter/spam patterns
trash_threads "in:inbox from:noreply" "No-Reply Emails"
trash_threads "in:inbox from:newsletter" "Newsletters"
trash_threads "in:inbox unsubscribe" "Marketing (has unsubscribe)"

echo "$(date): Gmail cleanup complete" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
