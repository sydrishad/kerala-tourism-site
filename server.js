const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');

const User = require('./models/User');
const Review = require('./models/Review');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/tourism')
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false
}));

// Make session available in all EJS views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Homepage
app.get('/', (req, res) => {
  res.render('index');
});

// Top Destinations Page
app.get('/destinations', (req, res) => {
  const spots = JSON.parse(fs.readFileSync('./data/spots.json', 'utf8'));
  res.render('destinations', { spots });
});

// Single destination page
app.get('/destination/:id', async (req, res) => {
  const id = req.params.id;
  const spots = JSON.parse(fs.readFileSync('./data/spots.json', 'utf8'));
  const place = spots.find(p => p.id === id);
  if (!place) return res.status(404).send('Destination not found');
  const reviews = await Review.find({ placeId: id });
  res.render('destination', { place, reviews });
});

// Submit a review
app.post('/review', async (req, res) => {
  const { placeId, comment } = req.body;
  const name = req.session.user?.username || 'Anonymous';
  await Review.create({ placeId, name, comment });
  res.redirect(`/destination/${placeId}`);
});

// Register page
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.send('Both fields are required.');
  const exists = await User.findOne({ username });
  if (exists) return res.send('Username already exists.');
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ username, password: hashed, role: 'user' });
  res.send('✅ Registration successful. <a href="/">Go to Home</a>');
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', { loginRole: 'user', message: null });
});

app.get('/login/admin', (req, res) => {
  res.render('login', { loginRole: 'admin', message: null });
});

// Handle user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('login', { loginRole: 'user', message: 'Invalid credentials' });
  }
  if (user.role === 'admin') {
    return res.render('login', { loginRole: 'user', message: 'Admins must login through admin page' });
  }
  req.session.user = { id: user._id, username: user.username, role: 'user' };
  res.redirect('/');
});

// Handle admin login
app.post('/login/admin', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password)) || user.role !== 'admin') {
    return res.render('login', { loginRole: 'admin', message: 'Invalid admin credentials' });
  }
  req.session.user = { id: user._id, username: user.username, role: 'admin' };
  res.redirect('/admin/dashboard');
});

// Admin dashboard
app.get('/admin/dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access denied.');
  }
  const reviews = await Review.find();
  res.render('dashboard', { reviews });
});

// Delete review
app.post('/delete-review', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access denied.');
  }
  await Review.findByIdAndDelete(req.body.id);
  res.redirect('/admin/dashboard');
});

// Edit review page
app.get('/edit-review', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access denied.');
  }
  const review = await Review.findById(req.query.id);
  if (!review) return res.status(404).send('Review not found');
  res.render('edit-review', { review });
});

// Update review
app.post('/update-review', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access denied.');
  }
  await Review.findByIdAndUpdate(req.body.id, {
    name: req.body.name,
    comment: req.body.comment
  });
  res.redirect('/admin/dashboard');
});

// Other static content (EJS)
app.get('/events', (req, res) => res.render('events'));
app.get('/districts', (req, res) => res.render('districts'));
app.get('/gallery', (req, res) => res.render('gallery'));
app.get('/faqs', (req, res) => res.render('faqs'));

// API endpoint
app.get('/api/about', (req, res) => {
  res.send('<h2>About Kerala Tourism</h2><p>This project showcases Kerala’s tourist spots, events, and interactive features for visitors.</p>');
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send("Page not found.");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});