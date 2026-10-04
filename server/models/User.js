import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Do not return password by default in queries
    },
    avatar: {
      type: String,
      default: '',
    },
    apiKey: {
      type: String,
      default: '',
      select: false,
    },
    apiKeys: {
      groq: {
        encryptedKey: { type: String, select: false, default: '' },
        iv: { type: String, select: false, default: '' },
        authTag: { type: String, select: false, default: '' },
        isValid: { type: Boolean, default: false },
        lastValidatedAt: { type: Date, default: null },
      },
      gemini: {
        encryptedKey: { type: String, select: false, default: '' },
        iv: { type: String, select: false, default: '' },
        authTag: { type: String, select: false, default: '' },
        isValid: { type: Boolean, default: false },
        lastValidatedAt: { type: Date, default: null },
      },
    },
    usage: {
      attemptsCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      maxFreeAttempts: {
        type: Number,
        default: 3,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user has an active, valid personal Groq API key configured
userSchema.methods.hasPersonalKey = function () {
  return Boolean(
    this.apiKeys?.groq?.encryptedKey &&
    this.apiKeys?.groq?.isValid !== false
  );
};

const User = mongoose.model('User', userSchema);

export default User;
