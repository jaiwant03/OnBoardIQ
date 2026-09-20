const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    trim: true
  },
  role: {
    type: String,
    default: 'Software Developer'
  },
  department: {
    type: String,
    default: 'Engineering'
  },
  experience: {
    type: String,
    enum: ['Fresher', 'Junior (1-2 yrs)', 'Mid-Level (3-5 yrs)', 'Senior (5+ yrs)'],
    default: 'Fresher'
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  skills: {
    type: [String],
    default: ['JavaScript', 'React', 'Node.js', 'Python', 'Git']
  },
  preferredLearningStyle: {
    type: String,
    default: 'Hands-on Projects & Code'
  },
  userType: {
    type: String,
    enum: ['employee', 'admin'],
    default: 'employee'
  },
  avatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Password hashing pre-save hook with double-hash protection
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next ? next() : undefined;

  // Guard: Prevent double-hashing if password is already a valid bcrypt hash
  if (typeof this.password === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(this.password)) {
    return next ? next() : undefined;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  if (next) next();
});

// Match password method with trimming and plain-text fallback upgrade
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!enteredPassword || !this.password) return false;

  const trimmedEntered = enteredPassword.toString().trim();

  // 1. Direct comparison if stored in plain text (e.g. legacy seed data)
  if (this.password === enteredPassword || this.password === trimmedEntered) {
    // Migrate plain text to bcrypt hash transparently
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(trimmedEntered, salt);
    await this.save();
    return true;
  }

  // 2. Standard bcrypt comparison
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    if (isMatch) return true;
  } catch (err) {
    // In case stored password isn't valid bcrypt format
  }

  // 3. Fallback comparison with trimmed input if different
  if (trimmedEntered !== enteredPassword) {
    try {
      const isTrimMatch = await bcrypt.compare(trimmedEntered, this.password);
      if (isTrimMatch) return true;
    } catch (err) {}
  }

  return false;
};

module.exports = mongoose.model('User', UserSchema);
