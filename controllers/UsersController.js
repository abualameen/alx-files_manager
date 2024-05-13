const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const UsersController = {
  postNew: async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log(`this is the ${email}`);

      if (!email) {
        return res.status(400).send({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).send({ error: 'Missing password' });
      }

      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).send({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const newUser = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });

      return res.status(201).json({ id: newUser.insertedId, email });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  getMe: async (req, res) => {
    const token = req.headers['x-token']; // Ensure correct header case
    if (!token) {
      console.log('toke1');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const userId = await redisClient.get(`auth_${token}`); // Retrieve user ID from Redis
      console.log(`user id : ${userId}`);
      if (!userId) {
        console.log('toke2');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const objectIdUserId = ObjectId(userId);
      // Retrieve user object from the database based on the user ID
      // const user = await dbClient.db.collection('users').findOne({ _id: userId });
      const user = await dbClient.db.collection('users').findOne({ _id: objectIdUserId });

      if (!user) {
        console.log('toke3');
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
