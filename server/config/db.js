import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In development mode: store in 'test' database/collections
    // In production mode: store in 'myStore' database/collections
    const dbName = process.env.DB_NAME || (isProduction ? 'myStore' : 'test');

    const conn = await mongoose.connect(mongoURI, {
      dbName,
    });

    console.log(
      `[Database] MongoDB Connected successfully to database '${conn.connection.name}' [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode] on host ${conn.connection.host}`
    );
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    // Keep app running with informative log
    return null;
  }
};

