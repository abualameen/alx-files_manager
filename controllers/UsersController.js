const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { userQueue } = require('../worker');

const UsersController = {
  postNew: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check for missing email and password
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      // Check if user already exists
      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash the password
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Insert new user into the database
      const newUser = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });

      // Add user to the queue for background processing
      userQueue.add({ userId: newUser.insertedId });

      // Return the user's ID and email
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
      // Retrieve user ID from Redis
      const userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Convert userId to ObjectId
      const objectIdUserId = ObjectId(userId);

      // Retrieve user object from the database based on the user ID
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
