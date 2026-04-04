#!/bin/bash
# Pre-trade checklist - run before ANY trade

echo "═══════════════════════════════════════════"
echo "  PRE-TRADE CHECKLIST"
echo "═══════════════════════════════════════════"

# 1. Date/Time
echo ""
echo "📅 DATE/TIME:"
date "+%A, %B %d, %Y %H:%M %Z"
DAY=$(date +%u)
HOUR=$(date +%H)

if [ "$DAY" -gt 5 ]; then
  echo "   ⚠️  WEEKEND - Market closed!"
elif [ "$HOUR" -lt 9 ] || [ "$HOUR" -ge 16 ]; then
  echo "   ⚠️  Outside market hours (9:30 AM - 4:00 PM ET)"
else
  echo "   ✅ Market is OPEN"
fi

# 2. Check TWS connection
echo ""
echo "🔌 TWS CONNECTION:"
cd /Users/openclaw/.openclaw/workspace/trading
node -e "
const ib = require('@stoqey/ib');
const c = new ib.IBApi({port:7496});
c.on('connected', () => { console.log('   ✅ TWS Connected'); c.disconnect(); process.exit(0); });
c.on('error', (e,code) => { if(code===502||code===504) { console.log('   ❌ TWS NOT Connected'); process.exit(1); }});
c.connect();
setTimeout(() => { console.log('   ❌ TWS Timeout'); process.exit(1); }, 3000);
" 2>/dev/null

# 3. Account status
echo ""
echo "💰 ACCOUNT:"
node -e "
const ib = require('@stoqey/ib');
const c = new ib.IBApi({port:7496});
c.on('connected', () => { c.reqAccountSummary(1,'All','NetLiquidation,AvailableFunds'); });
c.on('accountSummary', (r,a,tag,val) => { console.log('   ' + tag + ': \$' + parseFloat(val).toFixed(2)); });
c.connect();
setTimeout(() => { c.disconnect(); process.exit(0); }, 3000);
" 2>/dev/null

# 4. Current positions
echo ""
echo "📊 POSITIONS:"
node -e "
const ib = require('@stoqey/ib');
const c = new ib.IBApi({port:7496});
c.on('connected', () => { c.reqPositions(); });
c.on('position', (a,contract,pos,cost) => { 
  if(pos!==0) console.log('   ' + (contract.localSymbol||contract.symbol) + ': ' + pos);
});
c.connect();
setTimeout(() => { c.disconnect(); process.exit(0); }, 3000);
" 2>/dev/null

echo ""
echo "═══════════════════════════════════════════"
echo "  Run sentiment check next:"
echo "  bird search '\$SPY' -n 10 --plain"
echo "═══════════════════════════════════════════"
