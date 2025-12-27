import { Client, Databases, ID } from 'node-appwrite';
import { config } from 'dotenv';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

const CONFIG = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
  projectId: process.env.VITE_APPWRITE_PROJECT_ID || 'verify-news',
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: process.env.VITE_APPWRITE_DATABASE_ID || 'verifynews-db',
};

// Error categories for better handling
const ErrorCategory = {
  AUTHENTICATION: 'authentication',
  NETWORK: 'network',
  PERMISSION: 'permission',
  RATE_LIMIT: 'rate_limit',
  CONFLICT: 'conflict',
  NOT_FOUND: 'not_found',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown',
};

/**
 * Categorize error by type for better handling
 */
function categorizeError(error) {
  const code = error.code || error.status;
  const message = error.message?.toLowerCase() || '';

  if (code === 401 || message.includes('unauthorized') || message.includes('api key')) {
    return ErrorCategory.AUTHENTICATION;
  }
  if (code === 403 || message.includes('permission') || message.includes('forbidden')) {
    return ErrorCategory.PERMISSION;
  }
  if (code === 404) {
    return ErrorCategory.NOT_FOUND;
  }
  if (code === 409 || message.includes('already exists') || message.includes('duplicate')) {
    return ErrorCategory.CONFLICT;
  }
  if (code === 429 || message.includes('rate limit') || message.includes('too many')) {
    return ErrorCategory.RATE_LIMIT;
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('econnrefused')) {
    return ErrorCategory.NETWORK;
  }
  if (message.includes('invalid') || message.includes('validation')) {
    return ErrorCategory.VALIDATION;
  }
  return ErrorCategory.UNKNOWN;
}

/**
 * Get recovery suggestion based on error category
 */
function getRecoverySuggestion(category, context = '') {
  const suggestions = {
    [ErrorCategory.AUTHENTICATION]: [
      '   1. Check your APPWRITE_API_KEY in .env.local',
      '   2. Ensure the API key has not expired',
      '   3. Verify the key has Database permissions',
      '   4. Regenerate the key if needed in Appwrite Console',
    ],
    [ErrorCategory.NETWORK]: [
      '   1. Check your internet connection',
      '   2. Verify the Appwrite endpoint URL is correct',
      '   3. Check if Appwrite server is running',
      '   4. Try again in a few minutes',
    ],
    [ErrorCategory.PERMISSION]: [
      '   1. Ensure your API key has the required scopes',
      '   2. Check project permissions in Appwrite Console',
      '   3. Verify you have access to the specified project',
    ],
    [ErrorCategory.RATE_LIMIT]: [
      '   1. Wait 60 seconds before trying again',
      '   2. Consider using batch operations',
      '   3. Check Appwrite rate limits documentation',
    ],
    [ErrorCategory.CONFLICT]: [
      `   1. The resource "${context}" already exists`,
      '   2. Use --force flag to recreate (will delete existing)',
      '   3. Manually delete in Appwrite Console if needed',
    ],
    [ErrorCategory.NOT_FOUND]: [
      `   1. The resource "${context}" was not found`,
      '   2. Ensure the database/collection was created first',
      '   3. Check for typos in IDs',
    ],
    [ErrorCategory.VALIDATION]: [
      '   1. Check attribute/index definitions for errors',
      '   2. Verify field types match Appwrite requirements',
      '   3. Review schema configuration',
    ],
    [ErrorCategory.UNKNOWN]: [
      '   1. Check Appwrite server logs for more details',
      '   2. Try running the script again',
      '   3. Report issue with error details if persists',
    ],
  };
  return suggestions[category] || suggestions[ErrorCategory.UNKNOWN];
}

/**
 * Logger with file output and colored console
 */
class SetupLogger {
  constructor() {
    this.logs = [];
    this.errors = [];
    this.warnings = [];
    this.startTime = Date.now();
    
    // Ensure logs directory exists
    const logsDir = join(process.cwd(), 'logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    this.logFile = join(logsDir, `appwrite-setup-${new Date().toISOString().split('T')[0]}.log`);
  }

  _timestamp() {
    return new Date().toISOString();
  }

  _write(level, message, data = null) {
    const entry = {
      timestamp: this._timestamp(),
      level,
      message,
      data,
    };
    this.logs.push(entry);
    
    // Write to file
    const logLine = `[${entry.timestamp}] [${level}] ${message}${data ? ` | ${JSON.stringify(data)}` : ''}\n`;
    try {
      writeFileSync(this.logFile, logLine, { flag: 'a' });
    } catch (e) {
      // Silent fail for file write
    }
  }

  info(message) {
    this._write('INFO', message);
    console.log(message);
  }

  success(message) {
    this._write('SUCCESS', message);
    console.log(`✅ ${message}`);
  }

  warn(message, data = null) {
    this._write('WARN', message, data);
    this.warnings.push({ message, data });
    console.warn(`⚠️  ${message}`);
  }

  error(message, error = null) {
    const errorData = error ? {
      message: error.message,
      code: error.code,
      type: error.type,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    } : null;
    
    this._write('ERROR', message, errorData);
    this.errors.push({ message, error: errorData });
    console.error(`❌ ${message}`);
    
    if (error) {
      const category = categorizeError(error);
      console.error(`   Category: ${category}`);
      console.error(`   Details: ${error.message}`);
      console.log('\n📝 Recovery suggestions:');
      getRecoverySuggestion(category, message).forEach(s => console.log(s));
    }
  }

  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    console.log('📊 SETUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Duration: ${duration}s`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Errors: ${this.errors.length}`);
    console.log(`   Log file: ${this.logFile}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.errors.forEach((e, i) => console.log(`   ${i + 1}. ${e.message}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w.message}`));
    }

    return this.errors.length === 0;
  }
}

/**
 * Retry an operation with exponential backoff
 */
async function withRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    retryableCategories = [ErrorCategory.NETWORK, ErrorCategory.RATE_LIMIT],
    context = 'operation',
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const category = categorizeError(error);

      if (!retryableCategories.includes(category) || attempt === maxRetries) {
        throw error;
      }

      console.log(`   🔄 Retry ${attempt}/${maxRetries} for ${context} in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * factor, maxDelay);
    }
  }

  throw lastError;
}

const logger = new SetupLogger();

async function main() {
  logger.info('🚀 Appwrite Database Setup v2 (Improved Schema)');
  logger.info('='.repeat(60));
  
  // Validate configuration
  const configErrors = [];
  if (!CONFIG.apiKey) {
    configErrors.push('APPWRITE_API_KEY is not set');
  }
  if (!CONFIG.endpoint) {
    configErrors.push('VITE_APPWRITE_ENDPOINT is not set');
  }
  if (!CONFIG.projectId) {
    configErrors.push('VITE_APPWRITE_PROJECT_ID is not set');
  }

  if (configErrors.length > 0) {
    logger.error('Configuration errors found:');
    configErrors.forEach(e => console.error(`   - ${e}`));
    console.log('\n📝 To fix:');
    console.log('   1. Copy .env.example to .env.local');
    console.log('   2. Fill in your Appwrite credentials');
    console.log('   3. Go to Appwrite Console → Project → Settings → API Keys');
    console.log('   4. Create a key with Database permissions');
    process.exit(1);
  }
  
  logger.info(`\n📋 Configuration:`);
  logger.info(`   Endpoint: ${CONFIG.endpoint}`);
  logger.info(`   Project: ${CONFIG.projectId}`);
  logger.info(`   Database: ${CONFIG.databaseId}`);
  
  // Test connection first
  const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);
  
  const databases = new Databases(client);

  // Verify connection
  logger.info('\n🔌 Testing connection to Appwrite...');
  try {
    await withRetry(
      async () => {
        // Try to list databases to verify connection
        await databases.list();
      },
      { context: 'connection test', maxRetries: 3 }
    );
    logger.success('Connected to Appwrite successfully');
  } catch (error) {
    logger.error('Failed to connect to Appwrite', error);
    process.exit(1);
  }
  
  // Create database with retry
  logger.info('\n📦 Setting up database...');
  try {
    await withRetry(
      async () => {
        try {
          await databases.get(CONFIG.databaseId);
          logger.info('   Database already exists');
        } catch (e) {
          if (e.code === 404) {
            await databases.create(CONFIG.databaseId, 'VerifyNews Database');
            logger.success('Database created');
          } else {
            throw e;
          }
        }
      },
      { context: 'database creation', maxRetries: 3 }
    );
  } catch (error) {
    logger.error('Failed to setup database', error);
    process.exit(1);
  }
  
  const collections = [
    {
      id: 'users',
      name: 'Users',
      description: 'User profiles synchronized from Stack Auth',
      permissions: [
        'read("any")',      // Allow read access for analytics
        'create("any")',    // Allow anyone to create (during signup)
        'update("any")',    // Allow updates (profile changes)
        'delete("any")',    // Allow deletions (account deletion)
      ],
      attributes: [
        // Core identification
        { key: 'userId', type: 'string', size: 128, required: true }, // Stack Auth user ID
        { key: 'email', type: 'string', size: 255, required: true },
        { key: 'displayName', type: 'string', size: 255, required: false },
        { key: 'photoURL', type: 'string', size: 2048, required: false },
        
        // Authentication info
        { key: 'emailVerified', type: 'boolean', required: false, default: false },
        { key: 'signedUpAt', type: 'datetime', required: true },
        { key: 'lastSync', type: 'datetime', required: true },
        { key: 'isAnonymous', type: 'boolean', required: false, default: false },
        
        // Additional metadata
        { key: 'metadata', type: 'string', size: 10000, required: false }, // JSON string
      ],
      indexes: [
        // Primary lookup by Stack Auth user ID
        { key: 'idx_userId', type: 'unique', attributes: ['userId'] },
        
        // Email lookup (for admin)
        { key: 'idx_email', type: 'key', attributes: ['email'] },
        
        // Recent users
        { key: 'idx_signedUpAt', type: 'key', attributes: ['signedUpAt'], orders: ['DESC'] },
        
        // Active users (recently synced)
        { key: 'idx_lastSync', type: 'key', attributes: ['lastSync'], orders: ['DESC'] },
        
        // Email verification status
        { key: 'idx_emailVerified', type: 'key', attributes: ['emailVerified'] },
      ],
    },
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
        
        // Media
        { key: 'mediaId', type: 'string', size: 128, required: false },
        { key: 'mediaUrl', type: 'string', size: 2048, required: false },
        { key: 'mediaType', type: 'string', size: 50, required: false },
        
        // Metadata
        { key: 'timestamp', type: 'datetime', required: true },
        { key: 'isPublic', type: 'boolean', required: false, default: true },
        { key: 'viewCount', type: 'integer', required: false, min: 0, default: 0 },
        { key: 'upvotes', type: 'integer', required: false, min: 0, default: 0 },
        { key: 'downvotes', type: 'integer', required: false, min: 0, default: 0 },
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
        
        // Popularity sorting
        { key: 'idx_views', type: 'key', attributes: ['viewCount'], orders: ['DESC'] },
        { key: 'idx_votes', type: 'key', attributes: ['upvotes'], orders: ['DESC'] },
        
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
  
  // Create collections with improved error handling
  for (const coll of collections) {
    logger.info(`\n${'─'.repeat(60)}`);
    logger.info(`📋 Setting up collection: ${coll.name}`);
    logger.info(`   ${coll.description}`);
    
    let needsSetup = false;
    try {
      const existing = await withRetry(
        () => databases.getCollection(CONFIG.databaseId, coll.id),
        { context: `get collection ${coll.id}`, maxRetries: 2 }
      );
      logger.warn(`Collection ${coll.id} already exists`);
      logger.info('   💡 To recreate, delete it first in Appwrite Console');
      
      // Check if we should add missing attributes
      const existingAttrs = existing.attributes.map(a => a.key);
      const newAttrs = coll.attributes.filter(a => !existingAttrs.includes(a.key));
      
      if (newAttrs.length > 0) {
        logger.info(`   📝 Adding ${newAttrs.length} new attributes...`);
        for (const attr of newAttrs) {
          await createAttribute(databases, CONFIG.databaseId, coll.id, attr, logger);
        }
      }
      
    } catch (e) {
      if (e.code === 404) {
        needsSetup = true;
        try {
          await withRetry(
            () => databases.createCollection(
              CONFIG.databaseId,
              coll.id,
              coll.name,
              coll.permissions,
              false // documentSecurity - use collection-level permissions
            ),
            { context: `create collection ${coll.id}`, maxRetries: 3 }
          );
          logger.success(`Collection ${coll.id} created`);
        } catch (createError) {
          logger.error(`Failed to create collection ${coll.id}`, createError);
          continue;
        }
      } else {
        logger.error(`Error with collection ${coll.id}`, e);
        continue;
      }
    }
    
    if (needsSetup) {
      // Create attributes with progress tracking
      logger.info('   📝 Creating attributes...');
      let successCount = 0;
      let failCount = 0;
      
      for (const attr of coll.attributes) {
        const success = await createAttribute(databases, CONFIG.databaseId, coll.id, attr, logger);
        if (success) successCount++;
        else failCount++;
      }
      
      logger.info(`   Attributes: ${successCount} created, ${failCount} failed`);
      
      // Wait for attributes to be available
      logger.info('   ⏳ Waiting for attributes to be ready...');
      await waitForAttributes(databases, CONFIG.databaseId, coll.id, coll.attributes.length, logger);
      
      // Create indexes with error handling
      logger.info('   📊 Creating indexes...');
      let indexSuccessCount = 0;
      let indexFailCount = 0;
      
      for (const idx of coll.indexes) {
        try {
          await withRetry(
            () => databases.createIndex(
              CONFIG.databaseId,
              coll.id,
              idx.key,
              idx.type,
              idx.attributes,
              idx.orders || []
            ),
            { 
              context: `create index ${idx.key}`, 
              maxRetries: 2,
              retryableCategories: [ErrorCategory.NETWORK, ErrorCategory.RATE_LIMIT]
            }
          );
          console.log(`      ✅ ${idx.key}`);
          indexSuccessCount++;
        } catch (e) {
          if (e.code === 409) {
            console.log(`      ⏭️  ${idx.key} (already exists)`);
            indexSuccessCount++;
          } else {
            console.error(`      ❌ ${idx.key}: ${e.message}`);
            indexFailCount++;
          }
        }
      }
      
      logger.info(`   Indexes: ${indexSuccessCount} created, ${indexFailCount} failed`);
    }
  }
  
  // Print schema summary
  logger.info('\n' + '='.repeat(60));
  logger.info('📊 SCHEMA SUMMARY');
  logger.info('='.repeat(60));
  
  console.log('\n📁 users (User profiles from Stack Auth)');
  console.log('   ├── userId (unique) - Stack Auth user ID');
  console.log('   ├── email, displayName, photoURL - User profile');
  console.log('   ├── emailVerified, signedUpAt - Auth status');
  console.log('   ├── lastSync - When last synced from Stack Auth');
  console.log('   ├── isAnonymous - Anonymous user flag');
  console.log('   └── metadata - Additional user data (JSON)');
  
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
  
  logger.info('\n📝 Next steps:');
  console.log('   1. Update appwriteService.ts to use new schema');
  console.log('   2. Run migration script if there\'s existing data');
  console.log('   3. Test the application');
  console.log('\n🔄 User Synchronization:');
  console.log('   - Users will be automatically synced from Stack Auth to Appwrite');
  console.log('   - Run `bun run sync-users` to sync existing users');
}

// Add a user sync function that can be called separately
async function syncExistingUsers() {
  logger.info('\n🔄 Syncing existing users from Stack Auth to Appwrite...');
  
  // This would be implemented in a separate script
  // For now, just show the information
  logger.info('   📝 User sync functionality is implemented in the AuthContext');
  logger.info('   📝 Users are automatically synced on login/signup');
  logger.info('   📝 Use the userService.ts for manual sync operations');
}

async function createAttribute(databases, databaseId, collectionId, attr, log = logger) {
  try {
    switch (attr.type) {
      case 'string':
        await withRetry(
          () => databases.createStringAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array || false
          ),
          { context: `create attribute ${attr.key}`, maxRetries: 2 }
        );
        break;
      case 'integer':
        await withRetry(
          () => databases.createIntegerAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.min,
            attr.max,
            attr.default,
            attr.array || false
          ),
          { context: `create attribute ${attr.key}`, maxRetries: 2 }
        );
        break;
      case 'boolean':
        await withRetry(
          () => databases.createBooleanAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array || false
          ),
          { context: `create attribute ${attr.key}`, maxRetries: 2 }
        );
        break;
      case 'datetime':
        await withRetry(
          () => databases.createDatetimeAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array || false
          ),
          { context: `create attribute ${attr.key}`, maxRetries: 2 }
        );
        break;
      default:
        log.warn(`Unknown attribute type: ${attr.type} for ${attr.key}`);
        return false;
    }
    console.log(`      ✅ ${attr.key} (${attr.type})`);
    return true;
  } catch (e) {
    if (e.code === 409) {
      console.log(`      ⏭️  ${attr.key} (already exists)`);
      return true;
    } else {
      console.error(`      ❌ ${attr.key}: ${e.message}`);
      return false;
    }
  }
}

async function waitForAttributes(databases, databaseId, collectionId, expectedCount, log = logger, maxWait = 30000) {
  const startTime = Date.now();
  let lastReadyCount = 0;
  let stuckCount = 0;
  
  while (Date.now() - startTime < maxWait) {
    try {
      const collection = await databases.getCollection(databaseId, collectionId);
      const readyCount = collection.attributes.filter(a => a.status === 'available').length;
      const failedCount = collection.attributes.filter(a => a.status === 'failed').length;
      
      if (readyCount >= expectedCount) {
        console.log(`   ✅ All ${expectedCount} attributes ready`);
        return;
      }
      
      if (failedCount > 0) {
        const failed = collection.attributes.filter(a => a.status === 'failed');
        log.warn(`${failedCount} attributes failed to create: ${failed.map(a => a.key).join(', ')}`);
      }
      
      // Check if we're stuck
      if (readyCount === lastReadyCount) {
        stuckCount++;
        if (stuckCount > 10) {
          log.warn('Attribute creation seems stuck, continuing anyway...');
          return;
        }
      } else {
        stuckCount = 0;
        lastReadyCount = readyCount;
      }
      
      process.stdout.write(`   ⏳ ${readyCount}/${expectedCount} attributes ready...\r`);
    } catch (e) {
      // Log but don't fail on polling errors
      log.warn(`Error checking attributes: ${e.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  log.warn('Timeout waiting for attributes, continuing anyway...');
}

// Run with proper error handling
main()
  .then(() => {
    const success = logger.summary();
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logger.error('Unexpected error during setup', error);
    logger.summary();
    process.exit(1);
  });
