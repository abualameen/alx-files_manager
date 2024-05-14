const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;


app.use('/', routes);
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
