import { Client, Databases, Permission, Role } from 'node-appwrite';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const CONFIG = {
  endpoint: process.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1',
  projectId: process.env.VITE_APPWRITE_PROJECT_ID || 'verify-news',
  apiKey: process.env.APPWRITE_API_KEY,
  databaseId: process.env.VITE_APPWRITE_DATABASE_ID || 'verifynews-db',
};

async function main() {
  console.log('🔧 Fixing Appwrite Collection Permissions');
  console.log('='.repeat(60));
  
  if (!CONFIG.apiKey) {
    console.error('❌ APPWRITE_API_KEY not set');
    process.exit(1);
  }
  
  const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.projectId)
    .setKey(CONFIG.apiKey);
  
  const databases = new Databases(client);
  
  // Define the new permissions - allow any user (including guests) to perform all operations
  const publicPermissions = [
    Permission.read(Role.any()),
    Permission.create(Role.any()),
    Permission.update(Role.any()),
    Permission.delete(Role.any()),
  ];
  
  const collections = ['verifications', 'search_history'];
  
  for (const collectionId of collections) {
    console.log(`\n📋 Updating permissions for: ${collectionId}`);
    
    try {
      await databases.updateCollection(
        CONFIG.databaseId,
        collectionId,
        collectionId, // name stays the same
        publicPermissions,
        false, // documentSecurity
        true   // enabled
      );
      console.log(`   ✅ Permissions updated successfully!`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Permission fix complete!');
  console.log('\nNow refresh your app and try again.');
}

main().catch(console.error);
