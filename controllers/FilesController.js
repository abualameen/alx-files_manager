const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const mime = require('mime-types');
const Bull = require('bull');
// const imageThumbnail = require('image-thumbnail');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

// Bull queue
const fileQueue = new Bull('fileQueue');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const FilesController = {
  postUpload: async (req, res) => {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user based on token
    let user;
    try {
      const userId = await redisClient.get(`auth_${token}`); // Retrieve user ID from Redis
      console.log(`this is the useid: ${userId}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const objectIdUserId = ObjectId(userId);
      console.log(`objeciddd ${objectIdUserId}`);
      user = await dbClient.db.collection('users').findOne({ _id: objectIdUserId });
      console.log(`found ${user}`);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // const user = await dbClient.db.collection('users').findOne({ token });
      console.log(`found ${user}`);
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // if (!user) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    // Extract request parameters
    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;
    console.log(`this is body: ${req.body}`);
    console.log(`this is name: ${req.body.name}`);

    // Validate request parameters
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Handle parentId (if provided)
    if (parentId !== 0) {
      let parentFile;
      try {
        parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      } catch (error) {
        console.error('Error retrieving parent file:', error);
        return res.status(400).json({ error: 'Invalid parent ID' });
      }
    }
    

    try {
      // Save file to database and disk
      // const localPath;
      if (type === 'folder') {
        const newFolder = {
          userId: user._id,
          name,
          type,
          isPublic,
          parentId,
        };
        const result = await dbClient.db.collection('files').insertOne(newFolder);
        return res.status(201).json(result.ops[0]);
      }
      const fileData = Buffer.from(data, 'base64');
      const fileId = new ObjectId();
      const localPath = path.join(FOLDER_PATH, `${fileId}.dat`);
      fs.writeFileSync(localPath, fileData);
      const newFile = {
        _id: fileId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId,
        localPath,
      };
      await dbClient.db.collection('files').insertOne(newFile);
      fileQueue.add({ userId: user._id, fileId: newFile._id });
      return res.status(201).json(newFile);
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  getShow: async (req, res) => {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user based on token
    let user;
    try {
      const userId = await redisClient.get(`auth_${token}`); // Retrieve user ID from Redis
     
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    
      console.log(`objeciddd ${objectIdUserId}`);
      user = await dbClient.db.collection('users').findOne({ _id: objectIdUserId });
   
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve file document based on ID
    const fileId = req.params.id;
    let file;
    try {
      file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });
    } catch (error) {
      console.error('Error retrieving file document:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }



    return res.json(file);
  },

  getIndex: async (req, res) => {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user based on token
    let user;
    try {
      const userId = await redisClient.get(`auth_${token}`); // Retrieve user ID from Redis

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const objectIdUserId = ObjectId(userId);

      user = await dbClient.db.collection('users').findOne({ _id: objectIdUserId });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }



    // Parse query parameters
    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page, 10) || 0;
    const limit = 20;
    const skip = page * limit;

    // Retrieve file documents with pagination
    let files;
    try {
      files = await dbClient.db.collection('files').aggregate([
        { $match: { userId: user._id.toString(), parentId } },
        { $skip: skip },
        { $limit: limit },
      ]).toArray();
    } catch (error) {
      console.error('Error retrieving file documents:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    return res.json(files);
  },

  putPublish: async (req, res) => {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user based on token
    let user;
    try {
      const userId = await redisClient.get(`auth_${token}`); // Retrieve user ID from Redis
   
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const objectIdUserId = ObjectId(userId);

      user = await dbClient.db.collection('users').findOne({ _id: objectIdUserId });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }



    // Retrieve file document based on ID
    const fileId = req.params.id;
    let file;
    try {
      file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: user._id.toString() });
    } catch (error) {
      console.error('Error retrieving file document:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Update isPublic to true
    try {
      await dbClient.db.collection('files').updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: true } });
    } catch (error) {
      console.error('Error updating file document:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Return updated file document
    return res.json({ ...file, isPublic: true });
  },

  putUnpublish: async (req, res) => {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user based on token
    let user;
    try {
      const userId = await redisClient.get(`auth_${token}`); // Retrieve user ID from Redis

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const objectIdUserId = ObjectId(userId);

      user = await dbClient.db.collection('users').findOne({ _id: objectIdUserId });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

  

    // Retrieve file document based on ID
    const fileId = req.params.id;
    let file;
    try {
      file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: user._id.toString() });
    } catch (error) {
      console.error('Error retrieving file document:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Update isPublic to false
    try {
      await dbClient.db.collection('files').updateOne({ _id: ObjectId(fileId) }, { $set: { isPublic: false } });
    } catch (error) {
      console.error('Error updating file document:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Return updated file document
    return res.json({ ...file, isPublic: false });
  },

  getFile: async (req, res) => {
    // Retrieve file ID from request parameters
    const fileId = req.params.id;

    try {
      // Retrieve file document based on ID
      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });

      // If no file document is found, return Not found error
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (!file.isPublic && (!req.user || req.user.id !== file.userId)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // If file type is folder, return error A folder doesn't have content
      if (file.type === 'folder') {
        return res.status(400).json({ error: 'A folder doesn\'t have content' });
      }

      // Check if the file is locally present
      const filePath = file.localPath;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }
      const { size } = req.query;
      const resizedFilePath = `${file.localPath}_${size}`;
      if (!fs.existsSync(resizedFilePath)) {
        return res.status(404).json({ error: 'Not found' });
      }
      // Get MIME type based on the name of the file
      const mimeType = mime.lookup(file.name);

      // Set headers to specify content type
      res.set('Content-Type', mimeType);

      // Read file content and send as response
      fs.createReadStream(resizedFilePath).pipe(res);
      return res.end();
    } catch (error) {
      console.error('Error retrieving file:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

};

module.exports = FilesController;
