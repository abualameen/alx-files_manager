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
        // const newUser = await dbClient.db.collection('users').insertOne({ email, password: hashedPassword });
        const newUser = await dbClient.db.collection('users').insertOne({ id: newUser.insertedId, email, password: hashedPassword });

        return res.status(201).json({ id: newUser.id, email });
        } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    getMe: async (req, res) => {
        const token = req.headers['X-Token']; // Ensure correct header case
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    
        try {
            const userId = await redisClient.get(`auth_${token}`); // Retrieve user ID from Redis
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
    
            // Retrieve user object from the database based on the user ID
            const user = await dbClient.db.collection('users').findOne({ _id: userId });
    
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
