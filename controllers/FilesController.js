const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

const FilesController = {
    postUpload: async (req, res) => {
        const token = req.headers['x-token'];
        if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
        }

        // Retrieve user based on token
        const user = await dbClient.getUserByToken(token);
        if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
        }

        // Extract request parameters
        const { name, type, parentId, isPublic, data } = req.body;

        // Validate request parameters
        if (!name) {
        return res.status(400).json({ error: 'Missing name' });
        }
        if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type or invalid type' });
        }
        if (!data && type !== 'folder') {
        return res.status(400).json({ error: 'Missing data' });
        }

        // Handle parentId (if provided)
        if (parentId) {
        const parentFile = await dbClient.getFileById(parentId);
        if (!parentFile) {
            return res.status(400).json({ error: 'Parent not found' });
        }
        if (parentFile.type !== 'folder') {
            return res.status(400).json({ error: 'Parent is not a folder' });
        }
        }

        try {
        // Save file to database and disk
        let localPath;
        if (type === 'folder') {
            const newFolder = await dbClient.createFolder(user.id, name, isPublic, parentId || 0);
            return res.status(201).json(newFolder);
        } else {
            const fileData = Buffer.from(data, 'base64');
            const fileId = await dbClient.createFile(user.id, name, type, isPublic, parentId || 0, null);
            const localPath = path.join(FOLDER_PATH, `${fileId}.dat`);
            fs.writeFileSync(localPath, fileData);
            await dbClient.updateFileLocalPath(fileId, localPath);
            const newFile = await dbClient.getFileById(fileId);
            return res.status(201).json(newFile);
        }
        } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
        }
    },

    getShow: async (req, res) => {
        // Retrieve the user based on the token provided in the request header
        // Assuming the token is passed in the X-Token header
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Retrieve the file document based on the ID provided in the request parameters
        const fileId = req.params.id;
        let file;
        try {
            file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });
        } catch (error) {
            console.error('Error retrieving file document:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // If the file is not found or not linked to the user, return a "Not found" error
        if (!file || file.userId !== req.user.id) {
            return res.status(404).json({ error: 'Not found' });
        }

        // Otherwise, return the file document in the response
        return res.json(file);
    },

    getIndex: async (req, res) => {
        // Retrieve the user based on the token provided in the request header
        // Assuming the token is passed in the X-Token header
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Parse the query parameters to extract the parentId and page
        const parentId = req.query.parentId || '0';
        const page = parseInt(req.query.page) || 0;

        // Calculate skip and limit values for pagination
        const limit = 20;
        const skip = page * limit;

        // Retrieve the list of file documents based on the parentId and pagination
        let files;
        try {
            files = await dbClient.db.collection('files').aggregate([
                { $match: { parentId: parentId } },
                { $skip: skip },
                { $limit: limit }
            ]).toArray();
        } catch (error) {
            console.error('Error retrieving file documents:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Return the list of file documents in the response
        res.json(files)
    }
};

module.exports = FilesController;
