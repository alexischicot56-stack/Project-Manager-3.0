// ==========================================================================
// CONFIGURATION ET INITIALISATION CONFIGURATION FIREBASE
// ==========================================================================
// ⚠️ IMPORTANT : Remplace ce bloc par TES vraies clés fournies par Firebase !
const firebaseConfig = {
  apiKey: "AIzaSyCF2l6cRcU4xV03YtXmW8XTfgRvWRAKhhw",
  authDomain: "pm-pro-56e31.firebaseapp.com",
  projectId: "pm-pro-56e31",
  storageBucket: "pm-pro-56e31.firebasestorage.app",
  messagingSenderId: "320280953111",
  appId: "1:320280953111:web:301bf82b2fe6e4a063f752"
};

// Initialisation de Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// ==========================================================================
// DATA STATE (STOCKAGE DES DONNEES PROJETS ET UTILISATEURS EN MEMOIRE)
// ==========================================================================
let projectsList = [];
let usersList = [];
let selectedUserId = null;

// ==========================================================================
// 1. VRAIE GESTION DES ECRANS D'AUTHENTIFICATION (FIREBASE AUTOMATIQUE)
// ==========================================================================

// Déclenchée quand on clique sur le bouton "Se connecter avec Google"
function signInWithGoogle() {
    // Redirige l'utilisateur vers la page de connexion Google (idéal sur mobile)
    auth.signInWithRedirect(provider);
}

// Déclenchée quand on clique sur "Déconnexion"
function logOut() {
    auth.signOut().catch((error) => {
        alert("Erreur lors de la déconnexion : " + error.message);
    });
}

// ÉCOUTEUR EN TEMPS RÉEL : Détecte automatiquement si l'utilisateur est connecté ou non
auth.onAuthStateChanged((user) => {
    const authWrapper = document.getElementById('auth-wrapper');
    const mainApp = document.getElementById('main-app');
    const greetingEl = document.getElementById('user-greeting');

    if (user) {
        // L'UTILISATEUR EST CONNECTÉ !
        console.log("Connecté en tant que :", user.displayName);
        
        // 1. On affiche son vrai nom Google
        if (greetingEl) {
            greetingEl.innerText = `Bonjour, ${user.displayName} ! 👋`;
        }
        
        // 2. On bascule les écrans
        if (authWrapper) authWrapper.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        
        // 3. On charge les données de l'application
        updateDashboardStats();
        renderProjects();
        renderUsers();
        
        // 4. On force l'affichage sur l'onglet Accueil
        switchTab('view-home');

    } else {
        // L'UTILISATEUR EST DÉCONNECTÉ
        if (mainApp) mainApp.style.display = 'none';
        if (authWrapper) authWrapper.style.display = 'block';
        
        // Réinitialisation des états internes
        selectedUserId = null;
    }
});

// ==========================================================================
// 2. NAVIGATION INTERNE (SYSTEME D'ONGLETS)
// ==========================================================================

function switchTab(viewId) {
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');

    if (viewId === 'view-home') document.getElementById('btn-home')?.classList.add('active');
    if (viewId === 'view-projects') document.getElementById('btn-projects')?.classList.add('active');
    if (viewId === 'view-chat') document.getElementById('btn-chat')?.classList.add('active');
    if (viewId === 'view-settings') document.getElementById('btn-settings')?.classList.add('active');
}

// ==========================================================================
// 3. LOGIQUE METIER : COMPTEURS & GESTION DES PROJETS
// ==========================================================================

function updateDashboardStats() {
    const activeProjects = projectsList.filter(p => p.status === 'dev').length;
    const closedProjects = projectsList.filter(p => p.status === 'done').length;
    
    let totalHours = 0;
    projectsList.forEach(p => {
        if (p.status === 'done') totalHours += p.hoursSaved;
    });

    const statCount = document.getElementById('stat-count');
    const tasksCount = document.getElementById('tasks-count');
    const hoursCount = document.getElementById('hours-count');

    if (statCount) statCount.innerText = activeProjects;
    if (tasksCount) tasksCount.innerText = closedProjects;
    if (hoursCount) hoursCount.innerText = totalHours + "h";
}

function renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (projectsList.length === 0) {
        grid.innerHTML = `<p class="empty-state" style="grid-column: 1/-1;">Aucun projet créé pour le moment.</p>`;
        return;
    }

    projectsList.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        
        const isDone = project.status === 'done';
        const badgeClass = isDone ? 'badge-done' : 'badge-dev';
        const badgeText = isDone ? 'Clôturé' : 'En cours';

        let membersHTML = '';
        if (project.members && project.members.length > 0) {
            membersHTML = `<div class="project-members"><ion-icon name="people-outline"></ion-icon> Équipe: ${project.members.join(', ')}</div>`;
        }

        card.innerHTML = `
            <span class="project-badge ${badgeClass}">${badgeText}</span>
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            ${membersHTML}
            ${!isDone ? `
                <button class="btn-close-task" onclick="closeProject(${project.id})">
                    <ion-icon name="checkmark-done-outline"></ion-icon> Clôturer
                </button>
            ` : ''}
        `;
        grid.appendChild(card);
    });
}

function createNewProject() {
    const title = prompt("Entrez le titre de votre projet :");
    if (!title) return;

    const description = prompt("Entrez une courte description :");
    if (!description) return;

    const newProject = {
        id: Date.now(),
        title: title,
        description: description,
        status: 'dev',
        hoursSaved: 0,
        members: []
    };

    projectsList.unshift(newProject);
    renderProjects();
    updateDashboardStats();
}

function closeProject(projectId) {
    const project = projectsList.find(p => p.id === projectId);
    if (!project) return;

    const hoursInput = prompt("Combien d'heures avez-vous gagnées sur ce projet ? (Laissez vide pour 0) :");
    project.hoursSaved = parseInt(hoursInput, 10) || 0;
    project.status = 'done';

    renderProjects();
    updateDashboardStats();
}

// ==========================================================================
// 4. LOGIQUE METIER : CHAT ET COLLABORATEURS
// ==========================================================================

function renderUsers() {
    const container = document.getElementById('users-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (usersList.length === 0) {
        container.innerHTML = `<p class="empty-state">Aucun utilisateur ajouté.</p>`;
        return;
    }

    usersList.forEach(user => {
        const item = document.createElement('div');
        item.className = `user-item ${selectedUserId === user.id ? 'active' : ''}`;
        item.setAttribute('onclick', `selectUser(${user.id})`);

        const isPending = user.status === 'pending';
        const badgeClass = isPending ? 'pending' : 'accepted';
        const badgeText = isPending ? 'En attente' : 'Accepté';

        item.innerHTML = `
            <div class="user-item-info">
                <h4>${user.name}</h4>
                <span class="status-badge ${badgeClass}">${badgeText}</span>
            </div>
            ${isPending ? `
                <button class="btn-primary btn-small" style="width:100%; padding: 6px; font-size:12px; background:var(--success); margin-top: 8px;" onclick="simulateAcceptance(event, ${user.id})">
                    Accepter la demande
                </button>
            ` : ''}
        `;
        container.appendChild(item);
    });
}

function addNewUser() {
    const name = prompt("Entrez le pseudonyme de l'utilisateur à ajouter :");
    if (!name) return;

    const newUser = {
        id: Date.now(),
        name: name,
        status: 'pending',
        messages: []
    };

    usersList.push(newUser);
    renderUsers();
}

function simulateAcceptance(event, userId) {
    event.stopPropagation(); 
    const user = usersList.find(u => u.id === userId);
    if (!user) return;

    user.status = 'accepted';
    renderUsers();
    selectUser(userId); 
}

function selectUser(userId) {
    const user = usersList.find(u => u.id === userId);
    if (!user) return;

    selectedUserId = userId;
    renderUsers(); 

    const blankWindow = document.getElementById('chat-window-blank');
    const activeWindow = document.getElementById('chat-window-active');
    const chatUsername = document.getElementById('active-chat-username');

    if (user.status === 'pending') {
        if (blankWindow) blankWindow.style.display = 'flex';
        if (activeWindow) activeWindow.style.display = 'none';
    } else {
        if (blankWindow) blankWindow.style.display = 'none';
        if (activeWindow) activeWindow.style.display = 'flex';
        if (chatUsername) chatUsername.innerText = user.name;
        
        renderMessages();
    }
}

function renderMessages() {
    const box = document.getElementById('chat-messages-box');
    if (!box) return;
    
    box.innerHTML = '';

    const user = usersList.find(u => u.id === selectedUserId);
    if (!user) return;

    user.messages.forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${msg.type === 'sent' ? 'msg-sent' : 'msg-received'}`;
        msgDiv.innerText = msg.text;
        box.appendChild(msgDiv);
    });

    box.scrollTop = box.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input-field');
    if (!input) return;

    const text = input.value.trim();
    if (!text || selectedUserId === null) return;

    const user = usersList.find(u => u.id === selectedUserId);
    if (!user || user.status !== 'accepted') return;

    user.messages.push({ type: 'sent', text: text });
    input.value = '';
    renderMessages();

    setTimeout(() => {
        user.messages.push({ type: 'received', text: `Reçu ! Je travaille sur nos sujets.` });
        if (selectedUserId === user.id) {
            renderMessages();
        }
    }, 1200);
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function assignUserToProject() {
    const user = usersList.find(u => u.id === selectedUserId);
    if (!user || user.status !== 'accepted') return;

    const activeProjects = projectsList.filter(p => p.status === 'dev');

    if (activeProjects.length === 0) {
        alert("Vous n'avez aucun projet actif disponible pour y ajouter un collaborateur. Créez-en un d'abord !");
        return;
    }

    let messageMenu = "Sélectionnez le numéro du projet auquel ajouter " + user.name + " :\n\n";
    activeProjects.forEach((proj, index) => {
        messageMenu += `${index + 1}. ${proj.title}\n`;
    });

    const choice = prompt(messageMenu);
    if (choice === null) return; 

    const choiceIdx = parseInt(choice, 10) - 1;

    if (!isNaN(choiceIdx) && choiceIdx >= 0 && choiceIdx < activeProjects.length) {
        const selectedProject = activeProjects[choiceIdx];
        
        if (!selectedProject.members.includes(user.name)) {
            selectedProject.members.push(user.name);
            alert(`${user.name} a été ajouté avec succès au projet "${selectedProject.title}".`);
            renderProjects(); 
        } else {
            alert(`${user.name} collabore déjà sur ce projet !`);
        }
    } else {
        alert("Choix invalide.");
    }
}

// ==========================================================================
// 5. PARAMÈTRES : SYSTEME DE THÈME PAR ICONES
// ==========================================================================

function setTheme(themeName) {
    const darkBtn = document.getElementById('theme-dark-btn');
    const lightBtn = document.getElementById('theme-light-btn');

    if (themeName === 'light') {
        document.body.classList.add('light-mode');
        if (darkBtn) darkBtn.classList.remove('active');
        if (lightBtn) lightBtn.classList.add('active');
    } else {
        document.body.classList.remove('light-mode');
        if (lightBtn) lightBtn.classList.remove('active');
        if (darkBtn) darkBtn.classList.add('active');
    }
}