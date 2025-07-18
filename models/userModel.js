import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  id: { type: Number, unique: true }
});

const User = mongoose.model('User', userSchema);
export default User; 