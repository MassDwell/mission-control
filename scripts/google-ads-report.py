#!/usr/bin/env python3
"""Google Ads Campaign Report for DrawStack"""

import json
import os
import sys
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
import google.auth.transport.requests
import google.oauth2.credentials

HOME = os.path.expanduser("~")
CREDS_PATH = f"{HOME}/.openclaw/workspace/credentials/google/ads/ads-credentials.json"
TOKEN_PATH = f"{HOME}/.openclaw/workspace/credentials/google/ads/ads-token.json"

with open(CREDS_PATH) as f:
    creds = json.load(f)
with open(TOKEN_PATH) as f:
    token = json.load(f)

# Build the client config
config = {
    "developer_token": creds["developer_token"],
    "client_id": creds["client_id"],
    "client_secret": creds["client_secret"],
    "refresh_token": token["refresh_token"],
    "use_proto_plus": True,
}

try:
    client = GoogleAdsClient.load_from_dict(config)
except Exception as e:
    print(f"Client init error: {e}")
    sys.exit(1)

# List accessible customers
customer_service = client.get_service("CustomerService")
try:
    accessible = customer_service.list_accessible_customers()
    customer_ids = [r.replace("customers/", "") for r in accessible.resource_names]
    print(f"Found {len(customer_ids)} customer(s): {customer_ids}")
except GoogleAdsException as ex:
    print(f"Error listing customers: {ex}")
    sys.exit(1)

for customer_id in customer_ids:
    print(f"\n{'='*60}")
    print(f"Customer ID: {customer_id}")
    print(f"{'='*60}")

    ga_service = client.get_service("GoogleAdsService")

    # Campaign performance (last 7 days)
    campaign_query = """
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_micros,
            metrics.conversions,
            metrics.all_conversions
        FROM campaign
        WHERE segments.date DURING LAST_7_DAYS
            AND campaign.status != 'REMOVED'
        ORDER BY metrics.impressions DESC
        LIMIT 20
    """

    try:
        response = ga_service.search_stream(customer_id=customer_id, query=campaign_query)
        campaign_found = False
        for batch in response:
            for row in batch.results:
                campaign_found = True
                c = row.campaign
                m = row.metrics
                status_map = {2: "ENABLED", 3: "PAUSED", 4: "REMOVED"}
                status = status_map.get(c.status, str(c.status))
                print(f"\n📊 Campaign: {c.name}")
                print(f"   Status: {status}")
                print(f"   Impressions: {m.impressions:,}")
                print(f"   Clicks:      {m.clicks:,}")
                print(f"   CTR:         {m.ctr*100:.2f}%")
                print(f"   Avg CPC:     ${m.average_cpc/1e6:.2f}")
                print(f"   Total Cost:  ${m.cost_micros/1e6:.2f}")
                print(f"   Conversions: {m.conversions:.1f}")
        if not campaign_found:
            print("  No campaign data found for last 7 days.")
    except GoogleAdsException as ex:
        print(f"  Campaign query error: {ex.error.code().name}")
        for e in ex.failure.errors:
            print(f"    {e.message}")
        continue

    # Search terms report
    search_query = """
        SELECT
            search_term_view.search_term,
            search_term_view.status,
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.cost_micros,
            metrics.conversions,
            campaign.name
        FROM search_term_view
        WHERE segments.date DURING LAST_7_DAYS
            AND metrics.impressions > 0
        ORDER BY metrics.impressions DESC
        LIMIT 50
    """

    try:
        response = ga_service.search_stream(customer_id=customer_id, query=search_query)
        terms = []
        for batch in response:
            for row in batch.results:
                st = row.search_term_view
                m = row.metrics
                status_map = {2: "ADDED", 3: "EXCLUDED", 4: "NEAR_EXACT"}
                status = status_map.get(st.status, "OTHER")
                terms.append({
                    "term": st.search_term,
                    "status": status,
                    "impressions": m.impressions,
                    "clicks": m.clicks,
                    "ctr": m.ctr,
                    "cost": m.cost_micros / 1e6,
                    "conversions": m.conversions,
                    "campaign": row.campaign.name,
                })

        if terms:
            print(f"\n🔍 Search Terms (last 7 days, {len(terms)} total):")
            for t in terms[:30]:
                icon = "✅" if t["status"] == "ADDED" else "❌" if t["status"] == "EXCLUDED" else "⚠️"
                print(f"  {icon} \"{t['term']}\" | {t['impressions']} impr | {t['clicks']} clicks | CTR {t['ctr']*100:.1f}% | ${t['cost']:.2f}")
        else:
            print("\n  No search term data yet.")
    except GoogleAdsException as ex:
        print(f"  Search terms error: {ex.error.code().name}")
        for e in ex.failure.errors:
            print(f"    {e.message}")
