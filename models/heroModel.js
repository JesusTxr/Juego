import mongoose from 'mongoose';

const heroSchema = new mongoose.Schema({
  name: { type: String, required: true },
  alias: String,
  city: String,
  team: String,
  pets: [{ type: Number }], // Relación con mascotas
  userId: { type: Number, required: true }, // Dueño del superhéroe
  id: { type: Number, unique: true },
});

const Hero = mongoose.model('Hero', heroSchema);
export default Hero;