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
  async getUserByEmailAndPassword(email, hashedPassword) {
    if (!this.isConnected) {
      throw new Error('Not connected to MongoDB');
    }
    try {
      const user = await this.db.collection('users').findOne({ email, password: hashedPassword });
      return user;
    } catch (error) {
      console.error('Error retrieving user by email and password:', error);
      throw error;
    }
  }
  async getUserByToken(token) {
    if (!this.isConnected) {
      throw new Error('Not connected to MongoDB');
    }
    const usersCollection = this.db.collection('users');
    const user = await usersCollection.findOne({ token });
    return user;
  }

  async getFileById(fileId) {
    if (!this.isConnected) {
      throw new Error('Not connected to MongoDB');
    }
    const filesCollection = this.db.collection('files');
    const file = await filesCollection.findOne({ _id: ObjectId(fileId) });
    return file;
  }

  async createFolder(userId, name, isPublic = false, parentId = 0) {
    if (!this.isConnected) {
      throw new Error('Not connected to MongoDB');
    }
    const foldersCollection = this.db.collection('files');
    const folder = {
      userId: ObjectId(userId),
      name,
      type: 'folder',
      isPublic,
      parentId: parentId ? ObjectId(parentId) : 0
    };
    const result = await foldersCollection.insertOne(folder);
    return { id: result.insertedId, ...folder };
  }

  async createFile(userId, name, type, isPublic = false, parentId = 0, localPath = null) {
    if (!this.isConnected) {
      throw new Error('Not connected to MongoDB');
    }
    const filesCollection = this.db.collection('files');
    const file = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId ? ObjectId(parentId) : 0,
      localPath
    };
    const result = await filesCollection.insertOne(file);
    return result.insertedId;
  }

  async updateFileLocalPath(fileId, localPath) {
    if (!this.isConnected) {
      throw new Error('Not connected to MongoDB');
    }
    const filesCollection = this.db.collection('files');
    await filesCollection.updateOne({ _id: ObjectId(fileId) }, { $set: { localPath } });
  }
}

const dbClient = new DBClient();
dbClient.connect();

module.exports = dbClient;
