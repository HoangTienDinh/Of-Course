const Express = require('express');
const App = Express();
const BodyParser = require('body-parser');
const PORT = 9001;
require('dotenv').config();

//Database setup
const pg = require('pg');
const db = new pg.Client(process.env.DATABASE_URL);

db.connect();

// Middleware
App.use(BodyParser.urlencoded({ extended: false }));
App.use(Express.static('public'));
//Api Routes
const userRoutes = require('./routes/users')
App.use('/api/users', userRoutes(db));

// GET Routes
App.get('/api/data', (req, res) => res.json({
  message: "Seems to work!",
}));

App.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Express seems to be listening on port ${PORT} so that's pretty good 👍`);
});
