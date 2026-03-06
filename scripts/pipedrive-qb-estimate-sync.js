#!/usr/bin/env node

/**
 * Pipedrive → QuickBooks Estimate Automation (ENHANCED)
 * 
 * Creates customer-specific estimates with real products:
 * 1. Reads deal from Pipedrive (customer name, email, address, products)
 * 2. Looks up customer in QB by name/email
 * 3. If not found, creates new QB customer
 * 4. Matches Pipedrive products to QB items
 * 5. Creates estimate with real customer + products
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class PipedriveQBEstimateSyncClass {
  constructor() {
    this.pdToken = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../credentials/pipedrive/api-token.json'), 'utf-8')
    ).api_token;
    
    this.qbCreds = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../credentials/quickbooks/api-credentials.json'), 'utf-8')
    );

    this.syncLog = path.join(__dirname, '../logs/pipedrive-qb-estimate-sync.log');
    this.syncState = path.join(__dirname, '../data/massdwell/integrations/pd-qb-sync-state.json');
    
    // Cache for QB customers and items
    this.qbCustomerCache = {};
    this.qbItemCache = {};
    
    this.loadSyncState();
  }

  loadSyncState() {
    try {
      if (fs.existsSync(this.syncState)) {
        this.state = JSON.parse(fs.readFileSync(this.syncState, 'utf-8'));
      } else {
        this.state = { syncedDeals: {}, lastSync: null };
      }
    } catch (e) {
      this.state = { syncedDeals: {}, lastSync: null };
    }
  }

  saveSyncState() {
    const dir = path.dirname(this.syncState);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.syncState, JSON.stringify(this.state, null, 2));
  }

  log(msg) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message: msg };
    console.log(JSON.stringify(logEntry));
    
    // Append to log file
    const logDir = path.dirname(this.syncLog);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(this.syncLog, JSON.stringify(logEntry) + '\n');
  }

  async makeRequest(urlStr, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(urlStr);
      
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: { 'Content-Type': 'application/json', ...headers }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  async getDealsWithProducts() {
    try {
      const url = `https://api.pipedrive.com/v1/deals?api_token=${this.pdToken}&limit=500&status=open,won`;
      const response = await this.makeRequest(url);

      if (!response.data?.success) {
        this.log(`Error fetching deals: ${JSON.stringify(response.data)}`);
        return [];
      }

      return response.data.data.filter(d => d.products_count > 0) || [];
    } catch (e) {
      this.log(`Exception fetching deals: ${e.message}`);
      return [];
    }
  }

  async getDealDetails(dealId) {
    /**
     * Get full deal details including contact info
     */
    try {
      const url = `https://api.pipedrive.com/v1/deals/${dealId}?api_token=${this.pdToken}`;
      const response = await this.makeRequest(url);
      return response.data?.data || null;
    } catch (e) {
      this.log(`Error fetching deal ${dealId}: ${e.message}`);
      return null;
    }
  }

  async getDealProducts(dealId) {
    try {
      const url = `https://api.pipedrive.com/v1/deals/${dealId}/products?api_token=${this.pdToken}`;
      const response = await this.makeRequest(url);
      return response.data?.data || [];
    } catch (e) {
      this.log(`Error fetching products for deal ${dealId}: ${e.message}`);
      return [];
    }
  }

  async getPersonDetails(personId) {
    /**
     * Get person/contact details (name, email, phone, address)
     */
    try {
      const url = `https://api.pipedrive.com/v1/persons/${personId}?api_token=${this.pdToken}`;
      const response = await this.makeRequest(url);
      return response.data?.data || null;
    } catch (e) {
      this.log(`Error fetching person ${personId}: ${e.message}`);
      return null;
    }
  }

  async findQBCustomerByName(name, email) {
    /**
     * Search QB for customer by name or email
     */
    try {
      // Sanitize name
      const safeName = name.replace(/'/g, "''");
      const query = `SELECT * FROM Customer WHERE DisplayName = '${safeName}'`;
      const url = `https://quickbooks.api.intuit.com/v2/companies/${this.qbCreds.company_id}/query?query=${encodeURIComponent(query)}`;
      
      const response = await this.makeRequest(url, 'GET', null, {
        'Authorization': `Bearer ${this.qbCreds.access_token}`
      });

      if (response.data?.QueryResponse?.Customer?.length > 0) {
        return response.data.QueryResponse.Customer[0];
      }

      // Try by email (handle both string and object formats from Pipedrive)
      if (email) {
        const emailStr = typeof email === 'string' ? email : (email.value || email.email || '');
        if (emailStr) {
          const safeEmail = emailStr.replace(/'/g, "''");
          const emailQuery = `SELECT * FROM Customer WHERE PrimaryEmailAddr.Address = '${safeEmail}'`;
          const emailUrl = `https://quickbooks.api.intuit.com/v2/companies/${this.qbCreds.company_id}/query?query=${encodeURIComponent(emailQuery)}`;
          
          const emailResponse = await this.makeRequest(emailUrl, 'GET', null, {
            'Authorization': `Bearer ${this.qbCreds.access_token}`
          });

          if (emailResponse.data?.QueryResponse?.Customer?.length > 0) {
            return emailResponse.data.QueryResponse.Customer[0];
          }
        }
      }

      return null;
    } catch (e) {
      this.log(`Error searching QB for customer: ${e.message}`);
      return null;
    }
  }

  async createQBCustomer(person, deal) {
    /**
     * Create new customer in QB
     */
    try {
      // Handle Pipedrive's mixed format (fields can be strings or objects)
      const getStr = (field) => {
        if (!field) return '';
        if (typeof field === 'string') return field;
        if (typeof field === 'object' && field.value) return field.value;
        return '';
      };

      const email = getStr(person.email) || 'noemail@example.com';
      const phone = getStr(person.phone) || '';
      const address = getStr(person.address) || '';

      const customerData = {
        displayName: person.name || deal.title || 'Unknown Customer',
        primaryPhone: {
          freeFormNumber: phone
        },
        primaryEmailAddr: {
          address: email
        },
        billingAddr: {
          line1: address,
          city: person.city || '',
          state: person.state || '',
          postalCode: person.zipcode || ''
        },
        notes: `Created from Pipedrive deal: ${deal.title}`
      };

      const url = `https://quickbooks.api.intuit.com/v2/companies/${this.qbCreds.company_id}/customer`;
      const response = await this.makeRequest(url, 'POST', customerData, {
        'Authorization': `Bearer ${this.qbCreds.access_token}`
      });

      if (response.data?.Customer?.Id) {
        const customerId = response.data.Customer.Id;
        this.log(`✅ Created QB customer ${customerId}: ${customerData.displayName}`);
        return response.data.Customer;
      } else {
        this.log(`⚠️ QB create customer response: ${JSON.stringify(response.data)}`);
        return null;
      }
    } catch (e) {
      this.log(`❌ Error creating QB customer: ${e.message}`);
      return null;
    }
  }

  async findQBItemByName(itemName) {
    /**
     * Find QB item/product by name
     */
    try {
      const query = `SELECT * FROM Item WHERE Name = '${itemName.replace(/'/g, "''")}'`;
      const url = `https://quickbooks.api.intuit.com/v2/companies/${this.qbCreds.company_id}/query?query=${encodeURIComponent(query)}`;
      
      const response = await this.makeRequest(url, 'GET', null, {
        'Authorization': `Bearer ${this.qbCreds.access_token}`
      });

      if (response.data?.QueryResponse?.Item?.length > 0) {
        return response.data.QueryResponse.Item[0];
      }

      this.log(`⚠️ QB item not found: ${itemName}`);
      return null;
    } catch (e) {
      this.log(`Error searching QB for item ${itemName}: ${e.message}`);
      return null;
    }
  }

  async createQBEstimate(deal, products, qbCustomer, person) {
    /**
     * Create estimate in QB with real customer + products
     */
    try {
      const lines = [];
      let totalAmt = 0;

      for (const product of products) {
        // Find matching QB item
        const qbItem = await this.findQBItemByName(product.name);
        
        if (!qbItem) {
          this.log(`⚠️ Skipping product ${product.name} - not found in QB`);
          continue;
        }

        const amount = (product.sum_formatted?.replace(/[^0-9.-]/g, '') || product.sum || 0);
        const qty = product.quantity || 1;
        const unitPrice = amount / qty;

        lines.push({
          description: product.name,
          amount: amount,
          detailType: 'SalesItemLineDetail',
          salesItemLineDetail: {
            itemRef: {
              value: qbItem.Id
            },
            unitPrice: unitPrice,
            qty: qty
          }
        });

        totalAmt += amount;
      }

      if (lines.length === 0) {
        this.log(`❌ No valid QB items found for deal ${deal.id}`);
        return null;
      }

      const estimateData = {
        docNumber: `EST-${deal.id}`,
        txnDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customerRef: {
          value: qbCustomer.Id
        },
        line: lines,
        totalAmt: totalAmt,
        shipAddr: {
          line1: (typeof person.address === 'string' ? person.address : person.address?.value) || '',
          city: person.city || '',
          state: person.state || '',
          postalCode: person.zipcode || ''
        },
        privateNote: `Created from Pipedrive deal: ${deal.title}. Customer: ${person.name || qbCustomer.DisplayName}`
      };

      const url = `https://quickbooks.api.intuit.com/v2/companies/${this.qbCreds.company_id}/estimate`;
      const response = await this.makeRequest(url, 'POST', estimateData, {
        'Authorization': `Bearer ${this.qbCreds.access_token}`
      });

      if (response.data?.Estimate?.Id) {
        const estimateId = response.data.Estimate.Id;
        this.log(`✅ Created QB estimate ${estimateId} for ${person.name}: ${totalAmt}`);
        return estimateId;
      } else {
        this.log(`⚠️ QB estimate response: ${JSON.stringify(response.data)}`);
        return null;
      }
    } catch (e) {
      this.log(`❌ Error creating QB estimate: ${e.message}`);
      return null;
    }
  }

  async syncDealToQB(deal) {
    /**
     * Full sync workflow
     */

    // Skip if already synced
    if (this.state.syncedDeals[deal.id]) {
      return false;
    }

    this.log(`🔄 Processing deal ${deal.id}: ${deal.title}`);

    // Get full deal details
    const dealDetails = await this.getDealDetails(deal.id);
    if (!dealDetails) {
      this.log(`❌ Could not load deal details for ${deal.id}`);
      return false;
    }

    // Get products
    const products = await this.getDealProducts(deal.id);
    if (products.length === 0) {
      this.log(`⏭️ Deal has no products`);
      return false;
    }

    this.log(`Found ${products.length} products in deal`);

    // Get person/contact details
    const personId = dealDetails.person_id?.value;
    if (!personId) {
      this.log(`⚠️ Deal has no person_id, cannot create estimate`);
      return false;
    }

    const person = await this.getPersonDetails(personId);
    if (!person) {
      this.log(`❌ Could not load person details`);
      return false;
    }

    this.log(`Person: ${person.name} (${person.email})`);

    // Find or create QB customer
    // Handle Pipedrive's format where email might be an object
    const personEmail = typeof person.email === 'string' ? person.email : (person.email?.value || '');
    let qbCustomer = await this.findQBCustomerByName(person.name, personEmail);
    
    if (!qbCustomer) {
      this.log(`📝 Customer not found in QB, creating...`);
      qbCustomer = await this.createQBCustomer(person, dealDetails);
      
      if (!qbCustomer) {
        this.log(`❌ Failed to create QB customer`);
        return false;
      }
    } else {
      this.log(`✅ Found existing QB customer: ${qbCustomer.DisplayName} (${qbCustomer.Id})`);
    }

    // Create estimate
    const estimateId = await this.createQBEstimate(dealDetails, products, qbCustomer, person);

    if (estimateId) {
      this.state.syncedDeals[deal.id] = {
        qbEstimateId: estimateId,
        qbCustomerId: qbCustomer.Id,
        syncedAt: new Date().toISOString(),
        dealTitle: dealDetails.title,
        customerName: person.name
      };
      this.saveSyncState();
      return true;
    }

    return false;
  }

  async run() {
    this.log('🚀 Starting Pipedrive → QB estimate sync');
    this.state.lastSync = new Date().toISOString();

    const deals = await this.getDealsWithProducts();
    this.log(`Found ${deals.length} deals with products`);

    let synced = 0;
    let skipped = 0;

    for (const deal of deals) {
      const result = await this.syncDealToQB(deal);
      if (result) synced++;
      else skipped++;
    }

    this.saveSyncState();

    this.log(`✅ Sync complete: ${synced} synced, ${skipped} skipped`);
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      dealsChecked: deals.length,
      estimatesCreated: synced,
      skipped,
      status: 'complete'
    }));
  }
}

// Run it
if (require.main === module) {
  const sync = new PipedriveQBEstimateSyncClass();
  sync.run().catch(e => {
    console.error('Fatal error:', e.message);
    process.exit(1);
  });
}

module.exports = { PipedriveQBEstimateSyncClass };
