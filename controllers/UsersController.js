const crypto = require('crypto');
const dbClient = require('../utils/db');

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

<<<<<<< HEAD
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
    }
  },
};

module.exports = UsersController;
