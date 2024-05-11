import { MongoClient } from 'mongodb';


class DBClient {
    constructor(host = process.env.DB_HOST || 'localhost', port = process.env.DB_PORT || 27017, dbName = process.env.DB_DATABASE || 'files_manager') {
        this.host = host;
        this.port = port;
        this.dbName = dbName;
        this.client = new MongoClient(`mongodb://${host}:${port}`, { useUnifiedTopology: true });
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            this.isConnected = true;
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    }

    isAlive() {
        return this.isConnected;
    }

    async nbUsers() {
        if (!this.isConnected) {
            throw new Error('Not connected to MongoDB');
        }
        const collection = this.db.collection('users');
        const count = await collection.countDocuments();
        return count;
    }

    async nbFiles() {
        if (!this.isConnected) {
            throw new Error('Not connected to MongoDB');
        }
        const collection = this.db.collection('files');
        const count = await collection.countDocuments();
        return count;
    }
}

const dbClient = new DBClient();
dbClient.connect();

export default dbClient;
