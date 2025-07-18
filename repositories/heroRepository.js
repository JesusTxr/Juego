import Hero from '../models/heroModel.js';
import fs from 'fs-extra';

async function getHeroes() {
    try {
        return await Hero.find().populate('pets');
    } catch (error) {
        console.error('Error obteniendo los héroes:', error);
        return [];
    }
}

async function saveHero(heroData) {
    try {
        const hero = new Hero(heroData);
        const saved = await hero.save();
        await syncHeroesJson();
        return saved;
    } catch (error) {
        console.error('Error guardando el héroe:', error);
        throw error;
    }
}

async function saveHeroes(heroesArray) {
    try {
        for (const heroData of heroesArray) {
            await Hero.updateOne({ id: heroData.id }, heroData, { upsert: true });
        }
        await syncHeroesJson();
        return true;
    } catch (error) {
        console.error('Error guardando el arreglo de héroes:', error);
        throw error;
    }
}

async function syncHeroesJson() {
    const allHeroes = await Hero.find().populate('pets');
    await fs.writeJson('./data/superheroes.json', allHeroes, { spaces: 2 });
}

export default {
    getHeroes,
    saveHero,
    saveHeroes
};
