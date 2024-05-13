const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const AuthController = {
  getConnect: async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const user = await dbClient.db.collection('users').findOne({ email });
      // const user = await dbClient.getUserByEmailAndPassword(email, hashedPassword);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.password !== hashedPassword) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = uuidv4();
      const key = `auth_${token}`;
      const newUserResult = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
      const userId = newUserResult.insertedId;
      await redisClient.set(key, userId.toString(), 24 * 60 * 60); // Ensure userId is converted to string

      // await redisClient.set(key, user.insertedId, 'EX', 24 * 60 * 60); // Expire in 24 hours

      return res.status(200).json({ token });
    } catch (error) {
      console.error('Error signing in user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  getDisconnect: async (req, res) => {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await redisClient.del(key);
      return res.status(204).send();
    } catch (error) {
      console.error('Error signing out user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

module.exports = AuthController;
