import mongoose from 'mongoose';

const heroSchema = new mongoose.Schema({
  name: { type: String, required: true },
  alias: String,
  city: String,
  team: String,
  pets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }], // Relación con mascotas
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Dueño del superhéroe
  id: { type: Number, unique: true },
});

const Hero = mongoose.model('Hero', heroSchema);
export default Hero;