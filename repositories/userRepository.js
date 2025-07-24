import User from '../models/userModel.js';

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
        return true;
    } catch (error) {
        console.error('Error guardando el arreglo de usuarios:', error);
        throw error;
    }
}

export default {
    getUsers,
    saveUser,
    saveUsers
}; 