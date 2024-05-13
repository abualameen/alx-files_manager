const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const dbClient = require('./utils/db');

// Create a Bull queue
const fileQueue = new Bull('fileQueue');

// Process the queue
fileQueue.process(async (job) => {
  // Check if fileId and userId are present
  if (!job.data.fileId) {
    throw new Error('Missing fileId');
  }
  if (!job.data.userId) {
    throw new Error('Missing userId');
  }

  // Retrieve file document from DB
  const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(job.data.fileId), userId: job.data.userId });

  if (!file) {
    throw new Error('File not found');
  }

  // Generate thumbnails
  const sizes = [500, 250, 100];
  // eslint-disable-next-line no-await-in-loop
  for (const size of sizes) {
    const thumbnail = await imageThumbnail(file.localPath, { width: size, height: size });
    const thumbnailPath = `${file.localPath}_${size}`;
    await fs.promises.writeFile(thumbnailPath, thumbnail);
  }

  return send.end();
});

module.exports = fileQueue;
