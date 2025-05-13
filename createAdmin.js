const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/tourism')
  .then(async () => {
    const existing = await User.findOne({ username: 'admin' });
    if (existing) {
      console.log('Admin already exists.');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('12345', 10);
    await User.create({ username: 'admin', password: hashedPassword, role: 'admin' });

    console.log('✅ Admin user created.');
    process.exit();
  })
  .catch(err => {
    console.error('❌ Error creating admin:', err);
    process.exit(1);
  });

  