# 🦸‍♂️ Super Pet Heroes - Videojuego

Un videojuego tipo Pou donde puedes adoptar mascotas superhéroes, cuidarlas y jugar con ellas. Desarrollado con Node.js, MongoDB y HTML5.

## 🎮 Características del Juego

### 🔐 Sistema de Autenticación
- Registro de usuarios con email y contraseña
- Inicio de sesión seguro con JWT
- Persistencia de sesión

### 🦸‍♂️ Gestión de Superhéroes
- Crear y seleccionar superhéroes personalizados
- Cada héroe tiene nombre, alias, ciudad y equipo
- Interfaz visual atractiva con estilo Fall Guys

### 🐾 Sistema de Mascotas
- Adopción de mascotas con diferentes tipos de animales
- Cada mascota tiene superpoderes únicos
- Sistema de estadísticas completo:
  - Felicidad
  - Salud
  - Hambre
  - Personalidad
  - Enfermedades

### 🎯 Actividades del Juego
- **Alimentar**: Aumenta felicidad y salud
- **Pasear**: Mejora la felicidad
- **Bañar**: Cura enfermedades de la piel
- **Jugar**: Aumenta significativamente la felicidad

### 🛍️ Sistema de Tienda
- Ítems gratuitos y premium
- Comida especial, juguetes, medicina
- Sistema de monedas virtuales

### 📊 Perfil de Usuario
- Estadísticas completas del jugador
- Historial de actividades
- Progreso del juego

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 14 o superior)
- MongoDB Atlas (base de datos en la nube)
- Navegador web moderno

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd api-superheroes
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear un archivo `.env` en la raíz del proyecto:

```env
MONGODB_URI=tu_uri_de_mongodb_atlas
JWT_SECRET=tu_secreto_jwt_super_seguro
PORT=3001
```

### 4. Ejecutar el servidor
```bash
npm start
```

### 5. Acceder al juego
Abre tu navegador y ve a:
```
http://localhost:3001/game
```

## 🎮 Cómo Jugar

### 1. Registro e Inicio de Sesión
- Regístrate con tu email y contraseña
- Inicia sesión para acceder al juego

### 2. Selección de Superhéroe
- Crea un nuevo superhéroe o selecciona uno existente
- Personaliza su nombre, alias, ciudad y equipo

### 3. Adopción de Mascota
- Elige el nombre de tu mascota
- Selecciona el tipo de animal (perro, gato, conejo, etc.)
- Asigna un superpoder especial

### 4. Cuidado de la Mascota
- Realiza actividades diarias para mantener a tu mascota feliz
- Monitorea sus estadísticas (felicidad, salud, hambre)
- Cura enfermedades cuando sea necesario

### 5. Tienda y Personalización
- Compra ítems con las monedas ganadas
- Usa ítems para mejorar el estado de tu mascota
- Colecciona diferentes tipos de objetos

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js**: Runtime de JavaScript
- **Express.js**: Framework web
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: ODM para MongoDB
- **JWT**: Autenticación segura
- **bcryptjs**: Encriptación de contraseñas

### Frontend
- **HTML5**: Estructura del juego
- **CSS3**: Estilos y animaciones
- **JavaScript ES6+**: Lógica del juego
- **Font Awesome**: Iconos

### APIs y Documentación
- **Swagger**: Documentación de APIs
- **RESTful APIs**: Arquitectura de servicios

## 📁 Estructura del Proyecto

```
api-superheroes/
├── public/                 # Archivos del frontend
│   ├── index.html         # Página principal del juego
│   └── game.js            # Lógica del juego
├── controllers/           # Controladores de la API
│   ├── userController.js  # Gestión de usuarios
│   ├── heroController.js  # Gestión de superhéroes
│   ├── petController.js   # Gestión de mascotas
│   └── adoptionController.js # Gestión de adopciones
├── models/               # Modelos de datos
│   ├── userModel.js      # Modelo de usuario
│   ├── heroModel.js      # Modelo de superhéroe
│   ├── petModel.js       # Modelo de mascota
│   └── adoptionModel.js  # Modelo de adopción
├── services/             # Lógica de negocio
│   ├── heroServices.js   # Servicios de superhéroes
│   ├── petServices.js    # Servicios de mascotas
│   └── adoptionServices.js # Servicios de adopción
├── repositories/         # Acceso a datos
├── app.js               # Servidor principal
├── swagger.js           # Configuración de Swagger
└── package.json         # Dependencias del proyecto
```

## 🔧 Endpoints de la API

### Usuarios
- `POST /api/users/register` - Registro de usuario
- `POST /api/users/login` - Inicio de sesión
- `GET /api/users/profile` - Obtener perfil (requiere autenticación)

### Superhéroes
- `GET /api/heroes` - Obtener héroes del usuario
- `POST /api/heroes` - Crear nuevo héroe
- `PUT /api/heroes/:id` - Actualizar héroe
- `DELETE /api/heroes/:id` - Eliminar héroe

### Mascotas
- `GET /api/pets` - Obtener mascotas del usuario
- `POST /api/pets` - Crear nueva mascota
- `GET /api/pets/:id/status` - Obtener estado de la mascota
- `POST /api/pets/:id/activity` - Realizar actividad
- `POST /api/pets/:id/item` - Usar ítem en la mascota

### Adopciones
- `GET /api/adoptions` - Obtener adopciones del usuario
- `POST /api/adoptions` - Crear nueva adopción

## 🎨 Características Visuales

- **Diseño Responsivo**: Se adapta a diferentes tamaños de pantalla
- **Animaciones CSS**: Efectos visuales atractivos
- **Gradientes Modernos**: Estilo visual contemporáneo
- **Iconos Font Awesome**: Interfaz intuitiva
- **Estilo Fall Guys**: Personajes coloridos y divertidos

## 🔒 Seguridad

- **Autenticación JWT**: Tokens seguros para sesiones
- **Encriptación de Contraseñas**: bcrypt para seguridad
- **Validación de Datos**: Sanitización de entradas
- **CORS Configurado**: Acceso controlado desde frontend

## 🚀 Despliegue

### Heroku
1. Conectar repositorio a Heroku
2. Configurar variables de entorno
3. Desplegar automáticamente

### Vercel
1. Importar proyecto desde GitHub
2. Configurar variables de entorno
3. Desplegar con un clic

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para crear un juego divertido y educativo sobre el cuidado de mascotas.

---

¡Disfruta cuidando de tus mascotas superhéroes! 🦸‍♂️🐾 