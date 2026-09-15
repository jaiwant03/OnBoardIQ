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
    minlength: 6
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

// Password hashing pre-save hook
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
