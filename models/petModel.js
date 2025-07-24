import mongoose from 'mongoose';

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  animal: String,
  superpower: String,
  superheroeId: { type: Number },
  felicidad: { type: Number, default: 100 },
  vida: { type: Number, default: 100 },
  personalidad: { type: String, default: 'feliz' },
  enfermedades: [String],
  items: [String],
  historialActividades: [String],
  ultimaInteraccion: { type: Date, default: Date.now },
  hambre: { type: Number, default: 0 },
  id: { type: Number, unique: true },
});

const Pet = mongoose.model('Pet', petSchema);
export default Pet; 