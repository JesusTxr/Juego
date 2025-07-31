// Configuración del proyecto
export const config = {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://Jesus2711tm:jesus1234@cluster0.1ahixg6.mongodb.net/superheroes?retryWrites=true&w=majority&appName=Cluster0',
    JWT_SECRET: process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_para_jwt_2024',
    PORT: process.env.PORT || 3001
}; 