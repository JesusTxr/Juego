import User from '../models/userModel.js';
import fs from 'fs-extra';

async function getUsers() {
    try {
        return await User.find();
    } catch (error) {
        console.error('Error obteniendo los usuarios:', error);
        return [];
    }
}

async function saveUser(userData) {
    try {
        const user = new User(userData);
        const saved = await user.save();
        await syncUsersJson();
        return saved;
    } catch (error) {
        console.error('Error guardando el usuario:', error);
        throw error;
    }
}

async function saveUsers(usersArray) {
    try {
        for (const userData of usersArray) {
            await User.updateOne({ id: userData.id }, userData, { upsert: true });
        }
        await syncUsersJson();
        return true;
    } catch (error) {
        console.error('Error guardando el arreglo de usuarios:', error);
        throw error;
    }
}

async function syncUsersJson() {
    const allUsers = await User.find();
    await fs.writeJson('./data/users.json', allUsers, { spaces: 2 });
}

export default {
    getUsers,
    saveUser,
    saveUsers
}; 