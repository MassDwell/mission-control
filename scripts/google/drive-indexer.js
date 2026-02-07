const https = require('https');
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, '../../credentials/google/gmail-token.json');

function getToken() {
  return JSON.parse(fs.readFileSync(tokenPath, 'utf8')).access_token;
}

function apiRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(data));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function listAllFiles() {
  const files = [];
  let pageToken = null;
  
  do {
    let url = `https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,modifiedTime,size,parents,webViewLink)`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    
    const response = await apiRequest(url);
    if (response.files) files.push(...response.files);
    pageToken = response.nextPageToken;
    console.log(`  Indexed ${files.length} files...`);
  } while (pageToken);
  
  return files;
}

async function main() {
  console.log('=== Google Drive Indexer ===\n');
  console.log('Fetching all files...\n');
  
  const files = await listAllFiles();
  
  // Categorize files
  const categories = {
    folders: [],
    documents: [],
    spreadsheets: [],
    presentations: [],
    pdfs: [],
    images: [],
    videos: [],
    other: []
  };
  
  const folderMap = new Map();
  
  for (const file of files) {
    const type = file.mimeType;
    
    if (type === 'application/vnd.google-apps.folder') {
      categories.folders.push(file);
      folderMap.set(file.id, file.name);
    } else if (type === 'application/vnd.google-apps.document') {
      categories.documents.push(file);
    } else if (type === 'application/vnd.google-apps.spreadsheet') {
      categories.spreadsheets.push(file);
    } else if (type === 'application/vnd.google-apps.presentation') {
      categories.presentations.push(file);
    } else if (type === 'application/pdf') {
      categories.pdfs.push(file);
    } else if (type.startsWith('image/')) {
      categories.images.push(file);
    } else if (type.startsWith('video/')) {
      categories.videos.push(file);
    } else {
      categories.other.push(file);
    }
  }
  
  // Build summary
  console.log('\n=== Drive Summary ===\n');
  console.log(`📁 Folders: ${categories.folders.length}`);
  console.log(`📄 Documents: ${categories.documents.length}`);
  console.log(`📊 Spreadsheets: ${categories.spreadsheets.length}`);
  console.log(`📽️ Presentations: ${categories.presentations.length}`);
  console.log(`📕 PDFs: ${categories.pdfs.length}`);
  console.log(`🖼️ Images: ${categories.images.length}`);
  console.log(`🎥 Videos: ${categories.videos.length}`);
  console.log(`📎 Other: ${categories.other.length}`);
  console.log(`\nTotal: ${files.length} items`);
  
  // Key business documents
  console.log('\n=== Key Business Documents ===\n');
  
  const businessKeywords = ['investor', 'contract', 'proposal', 'catalogue', 'catalog', 'lookbook', 'deck', 'quote'];
  const keyDocs = files.filter(f => {
    const name = f.name.toLowerCase();
    return businessKeywords.some(k => name.includes(k));
  });
  
  for (const doc of keyDocs) {
    const parentName = doc.parents ? folderMap.get(doc.parents[0]) || 'Root' : 'Root';
    console.log(`📄 ${doc.name}`);
    console.log(`   Folder: ${parentName}`);
    console.log(`   Modified: ${doc.modifiedTime?.substring(0, 10)}`);
    console.log(`   Link: ${doc.webViewLink || 'N/A'}`);
    console.log('');
  }
  
  // Save full index
  const outputPath = path.join(__dirname, '../../data/massdwell/drive-index.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    indexedAt: new Date().toISOString(),
    totalFiles: files.length,
    summary: {
      folders: categories.folders.length,
      documents: categories.documents.length,
      spreadsheets: categories.spreadsheets.length,
      presentations: categories.presentations.length,
      pdfs: categories.pdfs.length,
      images: categories.images.length,
      videos: categories.videos.length,
      other: categories.other.length
    },
    keyDocuments: keyDocs,
    folders: categories.folders,
    allFiles: files
  }, null, 2));
  
  console.log(`\nFull index saved to ${outputPath}`);
}

main().catch(e => console.error('Error:', e));
