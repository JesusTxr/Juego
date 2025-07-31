// Game State
let gameState = {
  user: null,
  token: null,
  currentHero: null,
  currentPet: null,
  currentAdoption: null,
  isAuthMode: "login", // 'login' or 'register'
  coins: 100,
  inventory: [],
}

// API Base URL
const API_BASE = window.location.origin + "/api"

// Initialize game
document.addEventListener("DOMContentLoaded", () => {
  initializeGame()
  setupEventListeners()
})

function initializeGame() {
  // Check if user is already logged in
  const token = localStorage.getItem("token")
  if (token) {
    gameState.token = token
    validateToken()
  } else {
    // If no token, show auth screen
    showScreen("auth")
  }

  // Setup pet preview updates
  setupPetPreview()
  setupHeroPreview()
}

function setupEventListeners() {
  // Auth form
  const authForm = document.getElementById("authForm")
  if (authForm) {
    authForm.addEventListener("submit", handleAuth)
  }

  // Pet type change
  const petType = document.getElementById("petType")
  const petPower = document.getElementById("petPower")
  const petName = document.getElementById("petName")
  
  if (petType) petType.addEventListener("change", updatePetPreview)
  if (petPower) petPower.addEventListener("change", updatePetPreview)
  if (petName) petName.addEventListener("input", updatePetPreview)

  // Hero preview
  const heroName = document.getElementById("heroName")
  const heroAlias = document.getElementById("heroAlias")
  const heroColor = document.getElementById("heroColor")
  
  if (heroName) heroName.addEventListener("input", updateHeroPreview)
  if (heroAlias) heroAlias.addEventListener("input", updateHeroPreview)
  if (heroColor) heroColor.addEventListener("change", updateHeroPreview)
}

// Authentication
async function handleAuth(e) {
  e.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  if (!email || !password) {
    showNotification("Por favor completa todos los campos", "error")
    return
  }

  showLoading(true)

  try {
    const endpoint = gameState.isAuthMode === "login" ? "/users/login" : "/users/register"
    const response = await fetch(API_BASE + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      gameState.token = data.token
      gameState.user = data.user
      localStorage.setItem("token", data.token)

      showNotification(
        gameState.isAuthMode === "login" ? "Sesión iniciada correctamente" : "Cuenta creada correctamente",
      )

      // Update UI
      document.getElementById("userName").textContent = data.user.email
      document.getElementById("userInfo").classList.add("show")
      // Ensure logout button is visible
      document.querySelector('.btn-secondary[onclick="logout()"]').style.display = "inline-block"
      
      // Load user data
      await loadUserData()

      // Check user progress and show appropriate screen
      await checkUserProgress()
    } else {
      showNotification(data.message || "Error en la autenticación", "error")
    }
  } catch (error) {
    console.error("Auth error:", error)
    showNotification("Error de conexión", "error")
  }

  showLoading(false)
}

// Check user progress and show appropriate screen
async function checkUserProgress() {
  try {
    // Check if user has heroes
    const heroesResponse = await fetch(API_BASE + "/heroes", {
      headers: {
        Authorization: `Bearer ${gameState.token}`,
      },
    })
    
    if (heroesResponse.ok) {
      const heroes = await heroesResponse.json()
      
      if (heroes.length === 0) {
        // No heroes - show hero creation
        updateNavigationMenu("setup")
        showScreen("heroSelection")
        return
      }
      
      // User has heroes, check if they have pets
      const petsResponse = await fetch(API_BASE + "/pets", {
        headers: {
          Authorization: `Bearer ${gameState.token}`,
        },
      })
      
      if (petsResponse.ok) {
        const pets = await petsResponse.json()
        
        if (pets.length === 0) {
          // Has heroes but no pets - show pet adoption
          gameState.currentHero = heroes[0]
          updateNavigationMenu("setup")
          showScreen("petSelection")
          return
        }
        
        // User has both heroes and pets - show main game
        gameState.currentHero = heroes[0]
        gameState.currentPet = pets[0]
        updateNavigationMenu("main")
        document.getElementById("navTabs").style.display = "flex"
        showScreen("game")
        return
      }
    }
    
    // Fallback to hero selection
    showScreen("heroSelection")
  } catch (error) {
    console.error("Error checking user progress:", error)
    showScreen("heroSelection")
  }
}

async function validateToken() {
  try {
    const response = await fetch(API_BASE + "/users/profile", {
      headers: {
        Authorization: `Bearer ${gameState.token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      gameState.user = data

      document.getElementById("userName").textContent = data.email
      document.getElementById("userInfo").classList.add("show")
      // Ensure logout button is visible
      document.querySelector('.btn-secondary[onclick="logout()"]').style.display = "inline-block"

      await loadUserData()
      
      // Restore saved screen or check progress
      const savedScreen = localStorage.getItem("currentScreen")
      if (savedScreen && savedScreen !== "auth") {
        // Show navigation tabs for main game screens
        if (savedScreen === "game" || savedScreen === "shop" || savedScreen === "profile") {
          document.getElementById("navTabs").style.display = "flex"
          updateNavigationMenu("main")
        } else if (savedScreen === "heroSelection" || savedScreen === "petSelection") {
          document.getElementById("navTabs").style.display = "flex"
          updateNavigationMenu("setup")
        }
        showScreen(savedScreen)
      } else {
        await checkUserProgress()
      }
    } else {
      localStorage.removeItem("token")
      gameState.token = null
    }
  } catch (error) {
    console.error("Token validation error:", error)
    localStorage.removeItem("token")
    gameState.token = null
  }
}

function toggleAuthMode() {
  gameState.isAuthMode = gameState.isAuthMode === "login" ? "register" : "login"

  if (gameState.isAuthMode === "login") {
    document.getElementById("authTitle").textContent = "Iniciar Sesión"
    document.getElementById("authSubmit").textContent = "Iniciar Sesión"
    document.querySelector(".btn-secondary").textContent = "¿No tienes cuenta? Regístrate"
  } else {
    document.getElementById("authTitle").textContent = "Crear Cuenta"
    document.getElementById("authSubmit").textContent = "Crear Cuenta"
    document.querySelector(".btn-secondary").textContent = "¿Ya tienes cuenta? Inicia sesión"
  }
}

function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("currentScreen")
  gameState = {
    user: null,
    token: null,
    currentHero: null,
    currentPet: null,
    currentAdoption: null,
    isAuthMode: "login",
    coins: 100,
    inventory: [],
  }

  document.getElementById("userInfo").classList.remove("show")
  document.getElementById("navTabs").style.display = "none"
  showScreen("auth")

  // Reset forms
  document.getElementById("authForm").reset()
}

// Load user data
async function loadUserData() {
  // Load heroes first (which will also load pets)
  await loadHeroes()
  // Load adoptions separately
  await loadAdoptions()
}

// Heroes
async function loadHeroes() {
  try {
    const response = await fetch(API_BASE + "/heroes", {
      headers: {
        Authorization: `Bearer ${gameState.token}`,
      },
    })

    if (response.ok) {
      const heroes = await response.json()
      displayHeroes(heroes)

      if (heroes.length > 0) {
        gameState.currentHero = heroes[0]
        // After setting the current hero, load the correct pet
        await loadPets()
      }
    }
  } catch (error) {
    console.error("Error loading heroes:", error)
  }
}

function displayHeroes(heroes) {
  const heroGrid = document.getElementById("heroGrid")
  heroGrid.innerHTML = ""

  heroes.forEach((hero) => {
    const heroCard = document.createElement("div")
    heroCard.className = "hero-card"
    heroCard.onclick = () => selectHero(hero)

    heroCard.innerHTML = `
    <div style="width: 80px; height: 100px; margin: 0 auto 15px; position: relative;">
        <svg width="80" height="100" viewBox="0 0 80 100">
            <!-- Simplified stick figure for hero cards -->
            <circle cx="40" cy="15" r="8" class="stick-head"/>
            <line x1="40" y1="23" x2="40" y2="60" stroke="${hero.color || "#2d3436"}" stroke-width="3" stroke-linecap="round"/>
            <line x1="40" y1="35" x2="25" y2="45" stroke="${hero.color || "#2d3436"}" stroke-width="3" stroke-linecap="round"/>
            <line x1="40" y1="35" x2="55" y2="45" stroke="${hero.color || "#2d3436"}" stroke-width="3" stroke-linecap="round"/>
            <line x1="40" y1="60" x2="30" y2="85" stroke="${hero.color || "#2d3436"}" stroke-width="3" stroke-linecap="round"/>
            <line x1="40" y1="60" x2="50" y2="85" stroke="${hero.color || "#2d3436"}" stroke-width="3" stroke-linecap="round"/>
            <!-- Joints -->
            <circle cx="25" cy="45" r="2" fill="#fdcb6e"/>
            <circle cx="55" cy="45" r="2" fill="#fdcb6e"/>
            <circle cx="30" cy="85" r="2" fill="#fdcb6e"/>
            <circle cx="50" cy="85" r="2" fill="#fdcb6e"/>
            <circle cx="40" cy="35" r="2" fill="#fdcb6e"/>
            <circle cx="40" cy="60" r="2" fill="#fdcb6e"/>
        </svg>
    </div>
    <h3>${hero.name}</h3>
    <p><strong>${hero.alias}</strong></p>
    <p><i class="fas fa-city"></i> ${hero.city}</p>
    <p><i class="fas fa-users"></i> ${hero.team}</p>
`

    heroGrid.appendChild(heroCard)
  })
}

async function selectHero(hero) {
  gameState.currentHero = hero

  // Update UI
  document.querySelectorAll(".hero-card").forEach((card) => {
    card.classList.remove("selected")
  })
  event.currentTarget.classList.add("selected")

  // Load the pet associated with this hero
  await loadPets()

  showNotification(`Superhéroe ${hero.name} seleccionado`)
  updateProfileDisplay()
}

function showCreateHeroForm() {
  document.getElementById("createHeroForm").style.display = "block"
}

function hideCreateHeroForm() {
  document.getElementById("createHeroForm").style.display = "none"
  // Reset form
  document.getElementById("heroName").value = ""
  document.getElementById("heroAlias").value = ""
  document.getElementById("heroCity").value = ""
  document.getElementById("heroTeam").value = ""
}

  function setupHeroPreview() {
    const inputs = ["heroName", "heroAlias"]
    inputs.forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        element.addEventListener("input", updateHeroPreview)
        element.addEventListener("change", updateHeroPreview)
      }
    })
    
    // Color picker with real-time updates
    const colorPicker = document.getElementById("heroColorPicker")
    if (colorPicker) {
      colorPicker.addEventListener("input", updateHeroPreview)
      colorPicker.addEventListener("change", updateHeroPreview)
    }
  }

  function updateHeroPreview() {
    const name = document.getElementById("heroName").value || "Superhéroe"
    const alias = document.getElementById("heroAlias").value || "Alias"
    const color = document.getElementById("heroColorPicker").value || "#74b9ff"
  
    document.getElementById("heroPreviewName").textContent = name
    document.getElementById("heroPreviewAlias").textContent = alias
    
    // Update color preview
    const colorPreview = document.getElementById("colorPreview")
    if (colorPreview) {
      colorPreview.style.background = color
    }
  
    // Update dynamic stick figure
    const heroPreviewElement = document.getElementById("heroPreview")
    if (heroPreviewElement) {
      heroPreviewElement.innerHTML = createDynamicStickFigure(color)
    }
  }

  function createDynamicStickFigure(color) {
    return `
      <div class="stick-figure">
        <svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
          <!-- Cabeza -->
          <circle cx="50" cy="20" r="15" fill="${color}"/>
          
          <!-- Cuerpo -->
          <path d="M 50 35 L 50 95" stroke="${color}" fill="none"/>
          
          <!-- Brazo izquierdo (arriba) -->
          <path d="M 50 45 L 20 25" stroke="${color}" fill="none"/>
          
          <!-- Brazo derecho (abajo) -->
          <path d="M 50 55 L 80 75" stroke="${color}" fill="none"/>
          
          <!-- Pierna izquierda (adelante) -->
          <path d="M 50 95 L 30 140" stroke="${color}" fill="none"/>
          
          <!-- Pierna derecha (atrás) -->
          <path d="M 50 95 L 70 140" stroke="${color}" fill="none"/>
        </svg>
      </div>
    `
  }



async function createHero() {
  const name = document.getElementById("heroName").value
  const alias = document.getElementById("heroAlias").value
  const city = document.getElementById("heroCity").value
  const team = document.getElementById("heroTeam").value
  const color = document.getElementById("heroColorPicker").value

  if (!name || !alias || !city || !team) {
    showNotification("Por favor completa todos los campos", "error")
    return
  }

  showLoading(true)

  try {
    const response = await fetch(API_BASE + "/heroes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gameState.token}`,
      },
      body: JSON.stringify({ name, alias, city, team, color }),
    })

    if (response.ok) {
      const hero = await response.json()
      showNotification("Superhéroe creado correctamente")
      hideCreateHeroForm()
      await loadHeroes()
      gameState.currentHero = hero
      // Go to pet adoption screen
      updateNavigationMenu("setup")
      showScreen("petSelection")
    } else {
      const error = await response.json()
      showNotification(error.message || "Error al crear superhéroe", "error")
    }
  } catch (error) {
    console.error("Error creating hero:", error)
    showNotification("Error de conexión", "error")
  }

  showLoading(false)
}

// Pets
async function loadPets() {
  try {
    const response = await fetch(API_BASE + "/pets", {
      headers: {
        Authorization: `Bearer ${gameState.token}`,
      },
    })

    if (response.ok) {
      const pets = await response.json()
      if (pets.length > 0) {
        // Get the pet that is adopted by the current hero
        if (gameState.currentHero) {
          const adoptedPet = pets.find(pet => pet.heroId === gameState.currentHero.id)
          if (adoptedPet) {
            gameState.currentPet = adoptedPet
            console.log("Loaded adopted pet:", gameState.currentPet)
          } else {
            // Fallback to the most recent pet if no adoption found
            gameState.currentPet = pets[pets.length - 1]
            console.log("Loaded most recent pet (no adoption found):", gameState.currentPet)
          }
        } else {
          // If no current hero, use the most recent pet
          gameState.currentPet = pets[pets.length - 1]
          console.log("Loaded most recent pet (no current hero):", gameState.currentPet)
        }
        updateGameDisplay()
      }
    }
  } catch (error) {
    console.error("Error loading pets:", error)
  }
}

function setupPetPreview() {
  const petTypeSelect = document.getElementById("petType")
  const petPowerSelect = document.getElementById("petPower")
  const petNameInput = document.getElementById("petName")

  if (petTypeSelect) petTypeSelect.addEventListener("change", updatePetPreview)
  if (petPowerSelect) petPowerSelect.addEventListener("change", updatePetPreview)
  if (petNameInput) petNameInput.addEventListener("input", updatePetPreview)
}

function updatePetPreview() {
  const type = document.getElementById("petType").value
  const power = document.getElementById("petPower").value
  const name = document.getElementById("petName").value || "Mi Mascota"

  const typeEmojis = {
    perro: "🐕",
    gato: "🐱",
    conejo: "🐰",
    hamster: "🐹",
    loro: "🦜",
    dragon: "🐲",
  }

  const powerNames = {
    volar: "✈️ Volar",
    invisibilidad: "👻 Invisibilidad",
    super_fuerza: "💪 Super Fuerza",
    teletransporte: "⚡ Teletransporte",
    leer_mentes: "🧠 Leer Mentes",
    control_tiempo: "⏰ Control del Tiempo",
  }

  document.getElementById("petPreview").textContent = typeEmojis[type] || "🐕"
  document.getElementById("petPreviewName").textContent = name
  document.getElementById("petPreviewType").textContent = type.charAt(0).toUpperCase() + type.slice(1)
  document.getElementById("petPreviewPower").textContent = powerNames[power] || "✈️ Volar"
}

async function adoptPet() {
  const name = document.getElementById("petName").value
  const type = document.getElementById("petType").value
  const power = document.getElementById("petPower").value

  if (!name) {
    showNotification("Por favor ingresa un nombre para tu mascota", "error")
    return
  }

  if (!gameState.currentHero) {
    showNotification("Primero debes seleccionar un superhéroe", "error")
    return
  }

  showLoading(true)

  try {
    // Create pet
    const petResponse = await fetch(API_BASE + "/pets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gameState.token}`,
      },
      body: JSON.stringify({
        name,
        animal: type,
        superpower: power,
        heroId: gameState.currentHero.id,
      }),
    })

    if (petResponse.ok) {
      const pet = await petResponse.json()
      console.log("Pet created successfully:", pet)
      gameState.currentPet = pet

      // Create adoption record
      const adoptionResponse = await fetch(API_BASE + "/adoptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gameState.token}`,
        },
        body: JSON.stringify({
          heroId: gameState.currentHero.id,
          petId: pet.id,
        }),
      })

      if (adoptionResponse.ok) {
        const adoption = await adoptionResponse.json()
        console.log("Adoption created successfully:", adoption)
        gameState.currentAdoption = adoption

        showNotification(`¡${name} ha sido adoptado correctamente!`)
        
        // Update game display immediately with the adopted pet
        updateGameDisplay()
        await loadPets()
        updateGameDisplay()
        
        // Show navigation tabs and go to main game
        console.log("Navigating to game screen...")
        document.getElementById("navTabs").style.display = "flex"
        updateNavigationMenu("main")
        
        showScreen("game")
      } else {
        const adoptionError = await adoptionResponse.json()
        console.error("Error creating adoption:", adoptionError)
        showNotification("Mascota creada pero error al registrar adopción", "error")
      }
    } else {
      const error = await petResponse.json()
      showNotification(error.message || "Error al adoptar mascota", "error")
    }
  } catch (error) {
    console.error("Error adopting pet:", error)
    showNotification("Error de conexión", "error")
  }

  showLoading(false)
}

// Adoptions
async function loadAdoptions() {
  try {
    const response = await fetch(API_BASE + "/adoptions", {
      headers: {
        Authorization: `Bearer ${gameState.token}`,
      },
    })

    if (response.ok) {
      const adoptions = await response.json()
      if (adoptions.length > 0) {
        gameState.currentAdoption = adoptions[0]
      }
    }
  } catch (error) {
    console.error("Error loading adoptions:", error)
  }
}

// Game Actions
async function feedPet() {
  await performActivity("alimentar", {
    happiness: 20,
    health: 10,
    hunger: -30,
    coins: 5,
  })
}

async function walkPet() {
  await performActivity("pasear", {
    happiness: 15,
    health: 5,
    hunger: 10,
    coins: 3,
  })
}

async function bathePet() {
  await performActivity("bañar", {
    happiness: 10,
    health: 20,
    coins: 4,
  })
}

async function playWithPet() {
  await performActivity("jugar", {
    happiness: 25,
    health: 5,
    hunger: 15,
    coins: 6,
  })
}

async function performActivity(activityType, effects) {
  if (!gameState.currentPet) {
    showNotification("No tienes una mascota adoptada", "error")
    return
  }

  showLoading(true)

  try {
    const response = await fetch(API_BASE + `/pets/${gameState.currentPet.id}/activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gameState.token}`,
      },
      body: JSON.stringify({
        actividad: activityType,
        effects: effects,
      }),
    })

    if (response.ok) {
      const result = await response.json()

      // Update pet stats
      if (result.pet) {
        gameState.currentPet = result.pet
      }

      // Update coins
      if (effects.coins) {
        gameState.coins += effects.coins
        updateCoinsDisplay()
      }

      updateGameDisplay()

      const activityNames = {
        alimentar: "alimentaste",
        pasear: "paseaste con",
        bañar: "bañaste a",
        jugar: "jugaste con",
      }

      showNotification(`¡${activityNames[activityType]} ${gameState.currentPet.name}! +${effects.coins} monedas`)

      // Add animation
      document.getElementById("petDisplay").classList.add("pulse")
      setTimeout(() => {
        document.getElementById("petDisplay").classList.remove("pulse")
      }, 1000)
    } else {
      const error = await response.json()
      if (response.status === 429) {
        // Cooldown error
        const remainingTime = Math.ceil((error.cooldown || 5000) / 1000)
        showNotification(`Espera ${remainingTime} segundos antes de hacer esta actividad de nuevo`, "error")
      } else {
        showNotification(error.message || "Error al realizar actividad", "error")
      }
    }
  } catch (error) {
    console.error("Error performing activity:", error)
    showNotification("Error de conexión", "error")
  }

  showLoading(false)
}

// Shop
async function buyItem(itemType, cost) {
  if (cost > gameState.coins) {
    showNotification("No tienes suficientes monedas", "error")
    return
  }

  if (!gameState.currentPet) {
    showNotification("Necesitas una mascota para comprar ítems", "error")
    return
  }

  showLoading(true)

  try {
    const response = await fetch(API_BASE + `/pets/${gameState.currentPet.id}/item`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gameState.token}`,
      },
      body: JSON.stringify({
        itemType: itemType,
        cost: cost,
      }),
    })

    if (response.ok) {
      const result = await response.json()

      if (result.pet) {
        gameState.currentPet = result.pet
      }

      gameState.coins -= cost
      updateCoinsDisplay()
      updateGameDisplay()

      const itemNames = {
        comida_basica: "Comida Básica",
        agua: "Agua Fresca",
        comida_premium: "Comida Premium",
        juguete_especial: "Juguete Especial",
        medicina: "Medicina",
        traje_superheroe: "Traje de Superhéroe",
      }

      showNotification(`¡Compraste ${itemNames[itemType]}!`)
    } else {
      const error = await response.json()
      showNotification(error.message || "Error al comprar ítem", "error")
    }
  } catch (error) {
    console.error("Error buying item:", error)
    showNotification("Error de conexión", "error")
  }

  showLoading(false)
}

// UI Updates
function updateGameDisplay() {
  if (!gameState.currentPet) {
    console.log("No current pet found")
    return
  }

  const pet = gameState.currentPet
  console.log("Updating game display with pet:", pet)

  document.getElementById("currentPetName").textContent = pet.name
  
  document.getElementById("currentPetName").textContent = pet.name
  
  // Update pet display with images
  const petImages = {
    perro: "🐕",
    gato: "🐱", 
    conejo: "🐰",
    hamster: "🐹",
    loro: "🦜",
    dragon: "🐲",
  }

  // Update pet visual display
  const petDisplayElement = document.getElementById("petDisplay")
  if (petDisplayElement) {
    petDisplayElement.innerHTML = `<div style="font-size: 64px; text-align: center; margin: 20px 0;">${petImages[pet.animal] || "🐕"}</div>`
  }
  
  // Apply pet clothing if pet has items
  if (pet.items && pet.items.length > 0) {
    applyPetClothing(pet.items)
  }

  // Update stats
  const happiness = Math.max(0, Math.min(100, pet.felicidad || 100))
  const health = Math.max(0, Math.min(100, pet.vida || 100))
  const hunger = Math.max(0, Math.min(100, pet.hambre || 0))

  document.getElementById("happinessValue").textContent = happiness
  document.getElementById("healthValue").textContent = health
  document.getElementById("hungerValue").textContent = hunger

  document.getElementById("happinessBar").style.width = happiness + "%"
  document.getElementById("healthBar").style.width = health + "%"
  document.getElementById("hungerBar").style.width = hunger + "%"

  // Update pet status and mood
  let status = "Tu mascota está bien"
  let mood = "😊 Feliz"

  if (happiness < 30) {
    status = "Tu mascota está triste"
    mood = "😢 Triste"
  } else if (health < 30) {
    status = "Tu mascota necesita cuidados médicos"
    mood = "🤒 Enfermo"
  } else if (hunger > 70) {
    status = "Tu mascota tiene mucha hambre"
    mood = "😋 Hambriento"
  } else if (happiness > 80 && health > 80) {
    status = "Tu mascota está muy feliz y saludable!"
    mood = "🥰 Muy Feliz"
  }

  document.getElementById("petStatus").textContent = status
  document.getElementById("petMood").textContent = mood
}

function updateCoinsDisplay() {
  document.getElementById("userCoins").textContent = gameState.coins
  document.getElementById("shopCoins").textContent = gameState.coins
  document.getElementById("profileCoins").textContent = gameState.coins
}

function updateProfileDisplay() {
  if (gameState.currentHero) {
    document.getElementById("profileHeroName").textContent = gameState.currentHero.name
    document.getElementById("profileHeroAlias").textContent = gameState.currentHero.alias
    document.getElementById("profileHeroCity").textContent = gameState.currentHero.city
    document.getElementById("profileHeroTeam").textContent = gameState.currentHero.team
    document.getElementById("profileHeroColor").textContent = gameState.currentHero.color || "#74b9ff"

    // Update hero visual display
    const heroColor = gameState.currentHero.color || "#74b9ff"
    const profileHeroElement = document.getElementById("profileHeroUnifiedBody")
    if (profileHeroElement) {
      profileHeroElement.innerHTML = createDynamicStickFigure(heroColor)
    }
  }

  if (gameState.currentPet) {
    document.getElementById("profilePetName").textContent = gameState.currentPet.name
    document.getElementById("profilePetType").textContent = gameState.currentPet.animal
    document.getElementById("profilePetPower").textContent = gameState.currentPet.superpower
    
    document.getElementById("profilePetName").textContent = gameState.currentPet.name
    document.getElementById("profilePetType").textContent = gameState.currentPet.animal
    document.getElementById("profilePetPower").textContent = gameState.currentPet.superpower
    
    const typeEmojis = {
      perro: "🐕",
      gato: "🐱",
      conejo: "🐰",
      hamster: "🐹",
      loro: "🦜",
      dragon: "🐲",
    }

    document.getElementById("profilePetName").textContent = gameState.currentPet.name
    document.getElementById("profilePetType").textContent = gameState.currentPet.animal
    document.getElementById("profilePetPower").textContent = gameState.currentPet.superpower
    document.getElementById("profilePetAvatarLarge").textContent = typeEmojis[gameState.currentPet.animal] || "🐕"

    // Update pet stats
    const happiness = Math.max(0, Math.min(100, gameState.currentPet.felicidad || 100))
    const health = Math.max(0, Math.min(100, gameState.currentPet.vida || 100))
    const hunger = Math.max(0, Math.min(100, gameState.currentPet.hambre || 0))

    document.getElementById("profilePetHappinessValue").textContent = happiness
    document.getElementById("profilePetHealthValue").textContent = health
    document.getElementById("profilePetHungerValue").textContent = hunger

    document.getElementById("profilePetHappinessBar").style.width = happiness + "%"
    document.getElementById("profilePetHealthBar").style.width = health + "%"
    document.getElementById("profilePetHungerBar").style.width = hunger + "%"
  }
}

// Screen Management
function showScreen(screenName) {
  console.log("Showing screen:", screenName)
  
  // Save current screen to localStorage
  localStorage.setItem("currentScreen", screenName)
  
  // Hide all screens
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active")
  })

  // Update nav tabs
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active")
  })

  // Show selected screen
  const screenMap = {
    auth: "authScreen",
    heroSelection: "heroSelectionScreen",
    petSelection: "petSelectionScreen",
    game: "gameScreen",
    shop: "shopScreen",
    profile: "profileScreen",
  }

  const screenId = screenMap[screenName]
  console.log("Screen ID:", screenId)
  
  if (screenId) {
    const screenElement = document.getElementById(screenId)
    if (screenElement) {
      screenElement.classList.add("active")
      console.log("Screen activated:", screenId)
    } else {
      console.error("Screen element not found:", screenId)
    }
  }

  // Hide navigation tabs for setup screens
  if (screenName === "auth" || screenName === "heroSelection" || screenName === "petSelection") {
    document.getElementById("navTabs").style.display = "none"
  }

  // Update active nav tab only for main game screens
  if (screenName === "game" || screenName === "shop" || screenName === "profile") {
    const activeTab = document.querySelector(`[onclick="showScreen('${screenName}')"]`)
    if (activeTab) {
      activeTab.classList.add("active")
    }
  }

  // Update displays when showing certain screens
  if (screenName === "game") {
    updateGameDisplay()
    updateCoinsDisplay()
  } else if (screenName === "profile") {
    updateProfileDisplay()
    updateCoinsDisplay()
  } else if (screenName === "shop") {
    updateCoinsDisplay()
  }
}

// Navigation Menu Management
function updateNavigationMenu(mode) {
  const navTabs = document.getElementById("navTabs")
  const navButtons = navTabs.querySelectorAll(".nav-tab")
  
  if (mode === "setup") {
    // Show all navigation options for setup
    navButtons.forEach(button => {
      button.style.display = "inline-block"
    })
  } else if (mode === "main") {
    // Show only main game options (Juego, Tienda, Perfil)
    navButtons.forEach((button, index) => {
      if (index < 2) {
        // Hide Superhéroe and Mascota buttons
        button.style.display = "none"
      } else {
        // Show Juego, Tienda, Perfil buttons
        button.style.display = "inline-block"
      }
    })
  }
}

// Utility Functions
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification")
  const notificationText = document.getElementById("notificationText")

  notificationText.textContent = message
  notification.className = `notification ${type}`
  notification.classList.add("show")

  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

function showLoading(show) {
  const loading = document.getElementById("loading")
  loading.style.display = show ? "block" : "none"
}

// Auto-save game state and natural stat decay
setInterval(async () => {
  if (gameState.currentPet) {
    // Simulate natural stat changes
    const pet = gameState.currentPet

    // Gradually decrease happiness and increase hunger
    if (pet.felicidad > 0) pet.felicidad = Math.max(0, pet.felicidad - 1)
    if (pet.hambre < 100) pet.hambre = Math.min(100, pet.hambre + 2)
    
    // If hunger is high, decrease happiness
    if (pet.hambre > 70 && pet.felicidad > 0) {
      pet.felicidad = Math.max(0, pet.felicidad - 1)
    }

    // Update display if on game screen
    if (document.getElementById("gameScreen").classList.contains("active")) {
      updateGameDisplay()
    }
    
    // Save changes to database
    try {
      await fetch(API_BASE + `/pets/${pet.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gameState.token}`,
        },
        body: JSON.stringify(pet),
      })
    } catch (error) {
      console.error("Error saving pet stats:", error)
    }
  }
}, 30000) // Every 30 seconds

// Initialize pet preview on load
setTimeout(() => {
  updatePetPreview()
  updateHeroPreview()
}, 100)

function applyPetClothing(inventory) {
  const clothingLayer = document.getElementById("petClothes")
  if (!clothingLayer) return
  clothingLayer.innerHTML = ""

  if (inventory.includes("gafas_neon")) {
    clothingLayer.innerHTML += '<rect x="32" y="40" width="36" height="8" fill="#00cec9" rx="4"/>'
  }
  if (inventory.includes("capa_roja")) {
    clothingLayer.innerHTML += '<path d="M30 70 Q50 90 70 70" fill="#d63031"/>'
  }
  if (inventory.includes("sombrero_magico")) {
    clothingLayer.innerHTML += '<path d="M40 28 L60 28 L50 10 Z" fill="#6c5ce7"/>'
  }
}
 

 