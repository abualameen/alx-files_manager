const crypto = require('crypto');
const dbClient = require('../utils/db');

const UsersController = {
    postNew: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            if (!email) {
                return res.status(400).send({ error: 'Missing email' });
            }
            if (!password) {
                return res.status(400).send({ error: 'Missing password' });
            }

            const existingUser = await dbClient.db.collection('users').findOne({ email });
            if (existingUser) {
                return res.status(400).send({ error: 'User already exists' });
            }

            const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
            const newUser = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
            res.status(201).json({ id: newUser.insertedId, email });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

module.exports = UsersController;
