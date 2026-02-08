import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        throw new Error(
            'Please define the MONGODB_URI environment variable inside .env.local'
        );
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            family: 4 // Force IPv4 to avoid potential IPv6 DNS issues
        };

        // Debug: Show which URI is being used (Mask password)
        const maskedURI = MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
        console.log('Attempting to connect to MongoDB:', maskedURI);

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('MongoDB Connected Successfully');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default connectDB;
