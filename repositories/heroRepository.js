import Hero from '../models/heroModel.js';

async function getHeroes() {
    try {
        return await Hero.find();
    } catch (error) {
        console.error('Error obteniendo los héroes:', error);
        return [];
    }
}

async function saveHero(heroData) {
    try {
        const hero = new Hero(heroData);
        const saved = await hero.save();
        return saved;
    } catch (error) {
        console.error('Error guardando el héroe:', error);
        throw error;
    }
}

// Limpia un objeto héroe para que solo tenga las propiedades válidas
function limpiarHeroePlano(hero) {
    const { name, alias, city, team, pets, userId, id } = hero;
    return { name, alias, city, team, pets, userId, id };
}

async function saveHeroes(heroesArray) {
    try {
        for (const heroData of heroesArray) {
            const cleanHero = limpiarHeroePlano(heroData);
            await Hero.updateOne({ id: cleanHero.id }, cleanHero, { upsert: true });
        }
        return true;
    } catch (error) {
        console.error('Error guardando el arreglo de héroes:', error);
        throw error;
    }
}

export default {
    getHeroes,
    saveHero,
    saveHeroes
};
