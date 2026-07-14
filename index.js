const express = require('express');
const app = express();
const port = 3000;

// This serves your hello page at the root URL
app.get('/', (req, res) => {
  res.send('<h1>Hello World! Welcome to my JavaScript project.</h1>');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
