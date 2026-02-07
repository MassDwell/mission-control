const { IBApi, EventName, ErrorCode } = require("@stoqey/ib");

const ib = new IBApi({
  host: "127.0.0.1",
  port: 7496,
  clientId: 1
});

console.log("Connecting to TWS...");

ib.on(EventName.connected, () => {
  console.log("✅ Connected to TWS!");
  
  // Request account summary
  ib.reqAccountSummary(1, "All", "NetLiquidation,TotalCashValue,BuyingPower");
});

ib.on(EventName.accountSummary, (reqId, account, tag, value, currency) => {
  console.log(`📊 ${tag}: ${value} ${currency}`);
});

ib.on(EventName.accountSummaryEnd, () => {
  console.log("\n✅ Account data received!");
  ib.disconnect();
  process.exit(0);
});

ib.on(EventName.error, (err, code, reqId) => {
  if (code === ErrorCode.NOT_CONNECTED) {
    console.log("❌ Not connected to TWS");
  } else {
    console.log(`Error: ${err.message || err} (code: ${code})`);
  }
});

ib.on(EventName.disconnected, () => {
  console.log("Disconnected");
});

ib.connect();

setTimeout(() => {
  console.log("Timeout - check TWS is running with API enabled");
  process.exit(1);
}, 10000);
