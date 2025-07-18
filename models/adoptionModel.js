import mongoose from 'mongoose';

const adoptionSchema = new mongoose.Schema({
  heroId: { type: Number, required: true },
  petId: { type: Number, required: true },
  fechaAdopcion: { type: Date, default: Date.now },
  id: { type: Number, unique: true },
});

const Adoption = mongoose.model('Adoption', adoptionSchema);
export default Adoption; 