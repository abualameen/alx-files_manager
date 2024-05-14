const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use('/', routes);
app.use(express.json({ limit: '20mb' })); // Adjust the limit as needed
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
