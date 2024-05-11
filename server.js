const express = require('express');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;
app.use('/', routes);

app.listen(PORT, () => {
<<<<<<< HEAD
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
=======
    console.log(`Server is running on port ${PORT}`);
});
>>>>>>> 92d6d70fb0f8087dba385a839c60e346e3b61e65
