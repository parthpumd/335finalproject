require('dotenv').config();

const express = require('express');
const path = require('path');
const methodOverride = require('method-override');

const connectDB = require('./config/db');

const eventsRouter = require('./routes/events');
const wishlistRouter = require('./routes/wishlist');

const app = express();

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('pages/home', { title: 'Home' });
});

app.use('/events', eventsRouter);
app.use('/wishlist', wishlistRouter);

app.use((req, res, next) => {
  res.status(404).render('pages/error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  res.status(err.status || 500).render('pages/error', {
    title: 'Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong. Please try again later.'
      : err.message
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║    🎫 Event Wishlist Server Started 🎫    ║
╠════════════════════════════════════════════╣
║  Local:   http://localhost:${PORT}            ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                     ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
