import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import Hero from '../models/heroModel.js';
import Pet from '../models/petModel.js';
import Adoption from '../models/adoptionModel.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URL);

  // Limpiar colecciones
  await Hero.deleteMany({});
  await Pet.deleteMany({});
  await Adoption.deleteMany({});
  await User.deleteMany({});

  // Migrar usuarios (hasheando contraseña si es necesario)
  let usersRaw = [];
  let userIdList = [];
  if (await fs.pathExists('./data/users.json')) {
    usersRaw = await fs.readJson('./data/users.json');
    for (let i = 0; i < usersRaw.length; i++) {
      const user = usersRaw[i];
      let password = user.password;
      if (password.length < 20) {
        password = await bcrypt.hash(password, 10);
      }
      const newUser = new User({ email: user.email, password, id: i + 1 });
      await newUser.save();
    }
    const usersDb = await User.find({});
    userIdList = usersDb.map(u => u._id);
    console.log('Usuarios migrados.');
  } else {
    console.log('No se encontró data/users.json, omitiendo migración de usuarios.');
  }

  // Migrar héroes
  const heroesRaw = await fs.readJson('./data/superheroes.json');
  const heroIdMap = {};
  for (let i = 0; i < heroesRaw.length; i++) {
    const hero = heroesRaw[i];
    const { id, ...rest } = hero;
    const userId = userIdList[i % userIdList.length];
    const password = await bcrypt.hash('1234', 10);
    const newHero = new Hero({ ...rest, userId, password, id: i + 1 });
    await newHero.save();
    heroIdMap[id] = newHero._id;
  }

  // Migrar mascotas
  const petsRaw = await fs.readJson('./data/pets.json');
  const petIdMap = {};
  for (let i = 0; i < petsRaw.length; i++) {
    const pet = petsRaw[i];
    const { id, superheroeId, ...rest } = pet;
    let heroRef = superheroeId ? heroIdMap[superheroeId] : undefined;
    const newPet = new Pet({ ...rest, superheroeId: heroRef, id: i + 1 });
    await newPet.save();
    petIdMap[id] = newPet._id;
  }

  // Actualizar pets en héroes
  for (let i = 0; i < heroesRaw.length; i++) {
    const hero = heroesRaw[i];
    const heroDb = await Hero.findOne({ name: hero.name });
    if (heroDb) {
      const petsForHero = petsRaw.filter(p => p.superheroeId === hero.id).map((p, idx) => idx + 1);
      heroDb.pets = petsForHero;
      await heroDb.save();
    }
  }

  // Migrar adopciones
  const adoptionsRaw = await fs.readJson('./data/adoptions.json');
  for (let i = 0; i < adoptionsRaw.length; i++) {
    const adoption = adoptionsRaw[i];
    const { id, heroId, petId, ...rest } = adoption;
    const newAdoption = new Adoption({
      heroId: heroIdMap[heroId],
      petId: petIdMap[petId],
      ...rest,
      id: i + 1
    });
    await newAdoption.save();
  }

  console.log('Migración completada.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Error en la migración:', err);
  mongoose.disconnect();
}); 