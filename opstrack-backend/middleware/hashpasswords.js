const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://uday:OpsTrack123@ops.bswoune.mongodb.net/?retryWrites=true&w=majority&appName=Ops';

mongoose.connect(uri)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  name: String,
  rank: String,
  username: String,
  email: String,
  passwordHash: String,
  role: String,
  convoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Convoy',
    default: null
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function fixAndHashPasswords() {
  try {
    const users = await User.find();

    for (let user of users) {
      if (!user.passwordHash || user.passwordHash.trim() === '') {
        // Assign default password if missing or empty
        user.passwordHash = 'DefaultPass123';
        console.log(`⚠️ No password found for user: ${user.username}, assigning default password`);
      }

      // Hash only if not already hashed (bcrypt hashes start with $2a or $2b)
      if (!user.passwordHash.startsWith('$2')) {
        const hashed = await bcrypt.hash(user.passwordHash, 10);
        user.passwordHash = hashed;
        await user.save();
        console.log(`✅ Hashed password for: ${user.username}`);
      } else {
        console.log(`⚠️ Already hashed: ${user.username}`);
      }
    }

    console.log('🚀 All done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    mongoose.disconnect();
  }
}

fixAndHashPasswords();
