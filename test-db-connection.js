// Simple script to test database connection
import postgres from 'postgres';

// Connect to the default 'postgres' database instead of 'election'
const connectionString = "postgresql://muaythai_owner:npg_uo1cbjDyXRx0@ep-hidden-morning-a134x57e-pooler.ap-southeast-1.aws.neon.tech/postgres?sslmode=require";

async function testConnection() {
  console.log('Testing connection to Neon PostgreSQL...');
  
  try {
    const sql = postgres(connectionString);
    
    // List all databases
    console.log('Listing available databases:');
    const databases = await sql`SELECT datname FROM pg_database WHERE datistemplate = false`;
    console.log('Available databases:', databases.map(db => db.datname));
    
    // Check if 'election' database exists
    const electionDbExists = databases.some(db => db.datname === 'election');
    console.log('Election database exists:', electionDbExists);
    
    // Create 'election' database if it doesn't exist
    if (!electionDbExists) {
      console.log('Creating election database...');
      try {
        await sql`CREATE DATABASE election`;
        console.log('Election database created successfully!');
      } catch (createError) {
        console.error('Failed to create election database:', createError);
      }
    }
    
    // Close the connection
    await sql.end();
    
    return true;
  } catch (error) {
    console.error('Connection failed:', error);
    return false;
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('Database connection test completed successfully.');
    } else {
      console.log('Database connection test failed.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
