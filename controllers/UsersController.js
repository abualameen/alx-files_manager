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

        const user = await dbClient.getUserById(userId);
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        return res.status(200).json({ id: user.id, email: user.email });
        } catch (error) {
        console.error('Error retrieving user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
        }
    },
};

module.exports = UsersController;
