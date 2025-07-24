import heroRepository from '../repositories/heroRepository.js';
import AdoptionRepository from '../repositories/adoptionRepository.js';

async function getAllHeroes() {
  return await heroRepository.getHeroes();
}

async function addHero(hero) {
  if (!hero.name || !hero.alias) {
    throw new Error("El héroe debe tener un nombre y un alias.");
  }

  const heroes = await heroRepository.getHeroes();
  const newId = heroes.length > 0 ? Math.max(...heroes.map(h => h.id)) + 1 : 1;
  const newHero = { ...hero, id: newId };

  heroes.push(newHero);
  await heroRepository.saveHeroes(heroes);

  return newHero;
}

async function updateHero(id, updatedHero) {
  const heroes = await heroRepository.getHeroes();
  const index = heroes.findIndex(hero => hero.id === parseInt(id));

  if (index === -1) {
    throw new Error('Héroe no encontrado');
  }

  delete updatedHero.id;
  heroes[index] = { ...heroes[index], ...updatedHero };

  await heroRepository.saveHeroes(heroes);
  return heroes[index];
}

async function deleteHero(id) {
  // Validar si el héroe tiene adopciones
  const adoptions = await AdoptionRepository.getAdoptions();
  const adopted = adoptions.some(a => a.heroId === parseInt(id));
  if (adopted) {
    throw new Error('No se puede eliminar el héroe porque ya adoptó una mascota');
  }
  const heroes = await heroRepository.getHeroes();
  const index = heroes.findIndex(hero => hero.id === parseInt(id));

  if (index === -1) {
    throw new Error('Héroe no encontrado');
  }

  const filteredHeroes = heroes.filter(hero => hero.id !== parseInt(id));
  await heroRepository.saveHeroes(filteredHeroes);
  return { message: 'Héroe eliminado' };
}

async function findHeroesByCity(city) {
  const heroes = await heroRepository.getHeroes();
  return heroes.filter(hero => hero.city.toLowerCase() === city.toLowerCase());
}

async function faceVillain(heroId, villain) {
  const heroes = await heroRepository.getHeroes();
  const hero = heroes.find(hero => hero.id === parseInt(heroId));
  if (!hero) {
    throw new Error('Héroe no encontrado');
  }
  return `${hero.alias} enfrenta a ${villain}`;
}

async function getHeroById(id) {
  const heroes = await heroRepository.getHeroes();
  return heroes.find(hero => hero.id === parseInt(id));
}

export default {
  getAllHeroes,
  addHero,
  updateHero,
  deleteHero,
  findHeroesByCity,
  faceVillain,
  getHeroById
};
