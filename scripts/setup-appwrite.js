import { Client, Databases, ID } from 'node-appwrite';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const CONFIG = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
  projectId: process.env.VITE_APPWRITE_PROJECT_ID || 'verify-news',
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: process.env.VITE_APPWRITE_DATABASE_ID || 'verifynews-db',
};

async function main() {
  console.log('🚀 Appwrite Database Setup v2 (Improved Schema)');
  console.log('='.repeat(60));
  
  if (!CONFIG.apiKey) {
    console.error('❌ APPWRITE_API_KEY not set in .env.local');
    console.log('\n📝 To get an API key:');
    console.log('   1. Go to Appwrite Console → Project → Settings → API Keys');
    console.log('   2. Create a key with Database permissions');
    console.log('   3. Add to .env.local: APPWRITE_API_KEY=your-key');
    process.exit(1);
  }
  
  console.log(`\n📋 Configuration:`);
  console.log(`   Endpoint: ${CONFIG.endpoint}`);
  console.log(`   Project: ${CONFIG.projectId}`);
  console.log(`   Database: ${CONFIG.databaseId}`);
  
  const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);
  
  const databases = new Databases(client);
  
  // Create database
  console.log('\n📦 Setting up database...');
  try {
    await databases.get(CONFIG.databaseId);
    console.log('   ✅ Database already exists');
  } catch (e) {
    if (e.code === 404) {
      await databases.create(CONFIG.databaseId, 'VerifyNews Database');
      console.log('   ✅ Database created');
    } else {
      throw e;
    }
  }
  
  /**
   * IMPROVED COLLECTION DEFINITIONS
   * 
   * verifications: Stores shareable verification results (public)
   * - Optimized for public sharing and quick lookups by slug
   * - Includes denormalized veracity/confidence for filtering
   * 
   * search_history: Stores user's personal history (private)
   * - Linked to verifications via slug for full results
   * - Lightweight - doesn't duplicate full result data
   */
  const collections = [
    {
      id: 'verifications',
      name: 'Verifications',
      description: 'Public shareable verification results',
      permissions: [
        'read("any")',      // Public read for shared verifications
        'create("any")',    // Allow anyone (including anonymous) to create
        'update("any")',    // Allow updates for view count etc.
        'delete("any")',    // Allow deletions
      ],
      attributes: [
        // Core identification
        { key: 'slug', type: 'string', size: 20, required: true },
        { key: 'userId', type: 'string', size: 128, required: false }, // null = anonymous
        
        // Content being verified
        { key: 'query', type: 'string', size: 1000, required: false },
        { key: 'content', type: 'string', size: 10000, required: false },
        { key: 'title', type: 'string', size: 500, required: false },
        
        // Source article (if any)
        { key: 'articleUrl', type: 'string', size: 2048, required: false },
        { key: 'articleTitle', type: 'string', size: 500, required: false },
        
        // Verification result (denormalized for filtering)
        { key: 'veracity', type: 'string', size: 20, required: false }, // true, false, partially-true, unverified
        { key: 'confidence', type: 'integer', required: false, min: 0, max: 100 },
        { key: 'result', type: 'string', size: 50000, required: false }, // Full JSON result
        
        // Metadata
        { key: 'timestamp', type: 'datetime', required: true },
        { key: 'isPublic', type: 'boolean', required: false, default: true },
        { key: 'viewCount', type: 'integer', required: false, min: 0, default: 0 },
      ],
      indexes: [
        // Primary lookup
        { key: 'idx_slug', type: 'unique', attributes: ['slug'] },
        
        // User's verifications
        { key: 'idx_userId', type: 'key', attributes: ['userId'] },
        
        // Recent verifications (for feeds)
        { key: 'idx_timestamp', type: 'key', attributes: ['timestamp'], orders: ['DESC'] },
        
        // Filter by veracity
        { key: 'idx_veracity', type: 'key', attributes: ['veracity'] },
        
        // Composite: User's recent verifications
        { key: 'idx_user_time', type: 'key', attributes: ['userId', 'timestamp'], orders: ['ASC', 'DESC'] },
        
        // Composite: Public feed by veracity
        { key: 'idx_public_veracity', type: 'key', attributes: ['isPublic', 'veracity'] },
      ],
    },
    {
      id: 'search_history',
      name: 'Search History',
      description: 'User personal search and verification history',
      permissions: [
        'read("any")',      // Allow read access
        'create("any")',    // Allow anyone to create
        'update("any")',    // Allow updates
        'delete("any")',    // Allow deletions
      ],
      attributes: [
        // User identification (required)
        { key: 'userId', type: 'string', size: 128, required: true },
        
        // What was searched/verified
        { key: 'query', type: 'string', size: 1000, required: true },
        { key: 'title', type: 'string', size: 500, required: false },
        
        // Type of action
        { key: 'resultType', type: 'string', size: 20, required: true }, // 'search' or 'verification'
        
        // Link to full verification (if resultType = 'verification')
        { key: 'slug', type: 'string', size: 20, required: false },
        
        // Quick result preview (denormalized)
        { key: 'veracity', type: 'string', size: 20, required: false },
        { key: 'confidence', type: 'integer', required: false, min: 0, max: 100 },
        
        // Source article info
        { key: 'articleUrl', type: 'string', size: 2048, required: false },
        { key: 'articleTitle', type: 'string', size: 500, required: false },
        
        // Timestamps
        { key: 'timestamp', type: 'datetime', required: true },
      ],
      indexes: [
        // Primary: User's history (most common query)
        { key: 'idx_userId', type: 'key', attributes: ['userId'] },
        
        // User's history sorted by time
        { key: 'idx_user_time', type: 'key', attributes: ['userId', 'timestamp'], orders: ['ASC', 'DESC'] },
        
        // Filter by type
        { key: 'idx_user_type', type: 'key', attributes: ['userId', 'resultType'] },
        
        // Link to verification
        { key: 'idx_slug', type: 'key', attributes: ['slug'] },
      ],
    },
  ];
  
  // Create collections
  for (const coll of collections) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📋 Setting up collection: ${coll.name}`);
    console.log(`   ${coll.description}`);
    
    let needsSetup = false;
    try {
      const existing = await databases.getCollection(CONFIG.databaseId, coll.id);
      console.log('   ⚠️  Collection already exists');
      console.log('   💡 To recreate, delete it first in Appwrite Console');
      
      // Check if we should add missing attributes
      const existingAttrs = existing.attributes.map(a => a.key);
      const newAttrs = coll.attributes.filter(a => !existingAttrs.includes(a.key));
      
      if (newAttrs.length > 0) {
        console.log(`   📝 Adding ${newAttrs.length} new attributes...`);
        for (const attr of newAttrs) {
          await createAttribute(databases, CONFIG.databaseId, coll.id, attr);
        }
      }
      
    } catch (e) {
      if (e.code === 404) {
        needsSetup = true;
        await databases.createCollection(
          CONFIG.databaseId,
          coll.id,
          coll.name,
          coll.permissions,
          false // documentSecurity - use collection-level permissions
        );
        console.log('   ✅ Collection created');
      } else {
        console.error(`   ❌ Error: ${e.message}`);
        continue;
      }
    }
    
    if (needsSetup) {
      // Create attributes
      console.log('   📝 Creating attributes...');
      for (const attr of coll.attributes) {
        await createAttribute(databases, CONFIG.databaseId, coll.id, attr);
      }
      
      // Wait for attributes to be available
      console.log('   ⏳ Waiting for attributes to be ready...');
      await waitForAttributes(databases, CONFIG.databaseId, coll.id, coll.attributes.length);
      
      // Create indexes
      console.log('   📊 Creating indexes...');
      for (const idx of coll.indexes) {
        try {
          await databases.createIndex(
            CONFIG.databaseId,
            coll.id,
            idx.key,
            idx.type,
            idx.attributes,
            idx.orders || []
          );
          console.log(`      ✅ ${idx.key}`);
        } catch (e) {
          if (e.code === 409) {
            console.log(`      ⏭️  ${idx.key} (already exists)`);
          } else {
            console.error(`      ❌ ${idx.key}: ${e.message}`);
          }
        }
      }
    }
  }
  
  // Print schema summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SCHEMA SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n📁 verifications (Public shareable results)');
  console.log('   ├── slug (unique) - 8-char identifier for sharing');
  console.log('   ├── userId - Creator (null for anonymous)');
  console.log('   ├── query, content, title - What was verified');
  console.log('   ├── articleUrl, articleTitle - Source article');
  console.log('   ├── veracity, confidence - Quick filters (denormalized)');
  console.log('   ├── result - Full JSON verification result');
  console.log('   ├── timestamp - When created');
  console.log('   ├── isPublic - Sharing control');
  console.log('   └── viewCount - Analytics');
  
  console.log('\n📁 search_history (Private user history)');
  console.log('   ├── userId (required) - Owner');
  console.log('   ├── query, title - What was searched');
  console.log('   ├── resultType - "search" or "verification"');
  console.log('   ├── slug - Link to full verification');
  console.log('   ├── veracity, confidence - Quick preview');
  console.log('   ├── articleUrl, articleTitle - Source info');
  console.log('   └── timestamp - When performed');
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Appwrite setup complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Update appwriteService.ts to use new schema');
  console.log('   2. Run migration script if there\'s existing data');
  console.log('   3. Test the application');
}

async function createAttribute(databases, databaseId, collectionId, attr) {
  try {
    switch (attr.type) {
      case 'string':
        await databases.createStringAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.size,
          attr.required,
          attr.default,
          attr.array || false
        );
        break;
      case 'integer':
        await databases.createIntegerAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.min,
          attr.max,
          attr.default,
          attr.array || false
        );
        break;
      case 'boolean':
        await databases.createBooleanAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.default,
          attr.array || false
        );
        break;
      case 'datetime':
        await databases.createDatetimeAttribute(
          databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.default,
          attr.array || false
        );
        break;
    }
    console.log(`      ✅ ${attr.key} (${attr.type})`);
  } catch (e) {
    if (e.code === 409) {
      console.log(`      ⏭️  ${attr.key} (already exists)`);
    } else {
      console.error(`      ❌ ${attr.key}: ${e.message}`);
    }
  }
}

async function waitForAttributes(databases, databaseId, collectionId, expectedCount, maxWait = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    try {
      const collection = await databases.getCollection(databaseId, collectionId);
      const readyCount = collection.attributes.filter(a => a.status === 'available').length;
      
      if (readyCount >= expectedCount) {
        console.log(`   ✅ All ${expectedCount} attributes ready`);
        return;
      }
      
      process.stdout.write(`   ⏳ ${readyCount}/${expectedCount} attributes ready...\r`);
    } catch (e) {
      // Ignore errors, keep waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n   ⚠️  Timeout waiting for attributes, continuing anyway...');
}

main().catch(console.error);
