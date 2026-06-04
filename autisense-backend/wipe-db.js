import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

const wipeDatabase = async () => {
  try {
    console.log('Connecting to database...');
    const db = mongoose.connection;
    
    // Wait for connection to open
    db.once('open', async () => {
      console.log('Wiping all collections in MongoDB...');
      const collections = await db.db.listCollections().toArray();
      
      for (const col of collections) {
        console.log(`Dropping collection: ${col.name}`);
        await db.db.dropCollection(col.name);
      }
      
      console.log('✅ Database fully wiped!');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error wiping database:', error);
    process.exit(1);
  }
};

wipeDatabase();
