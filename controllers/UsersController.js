const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { userQueue } = require('../worker');

const UsersController = {
  postNew: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email && !password) {
        return res.status(400).json({ error: 'Missing email and Missing password' });
      }

      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }
     

      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const newUser = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
      userQueue.add({ userId: newUser.insertedId });
      return res.status(201).json({ id: newUser.insertedId, email });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  getMe: async (req, res) => {
    const token = req.headers['x-token']; // Ensure correct header case
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userId = await redisClient.get(`auth_${token}`); // Retrieve user ID from Redis
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const objectIdUserId = ObjectId(userId);
      const user = await dbClient.db.collection('users').findOne({ _id: objectIdUserId });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return only the id and email fields of the user object
      return res.status(200).json({ id: user._id, email: user.email });
    } catch (error) {
      console.error('Error retrieving user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

};

module.exports = UsersController;
