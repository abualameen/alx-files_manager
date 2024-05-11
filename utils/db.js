const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

const start = async () => {
    try {
        const uri = 'mongodb+srv://abulyaqs:' + encodeURIComponent('April_1985@') + '@filemanager.143vi99.mongodb.net/?retryWrites=true&w=majority&appName=filemanager';
        console.log(uri);
        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            ssl: true,
            tls: true
        });
        
        console.log('MongoDB connection successful!');
    } catch (e) {
        console.log('Error connecting to MongoDB:', e.message);
    }
}

start();

