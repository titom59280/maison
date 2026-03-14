<template>
  <div class="container">
    <div v-if="!isAuth" class="login-box">
      <div class="login-content">
        <h1>SweetHome<span>.privé</span></h1>
        <p class="login-subtitle">Veuillez saisir votre accès</p>
        
        <div class="login-form">
          <input 
            v-model="password" 
            type="password" 
            @keyup.enter="login" 
            placeholder="Mot de passe"
            class="styled-input"
          >
          <button @click="login" class="btn btn-primary btn-login">
            Entrer <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-else>
      <header class="main-header">
        <h1>Nos <span>Recherches</span></h1>
        <button @click="openModal()" class="btn btn-primary btn-add-house">
          <i class="fa-solid fa-plus"></i> <span>Ajouter</span>
        </button>
      </header>

      <draggable 
        v-model="maisons" 
        item-key="id" 
        handle=".handle"
        @end="syncWithBackend"
        class="house-list"
        ghost-class="sortable-ghost"
      >
        <template #item="{ element, index }">
          <div class="house-card-wrapper">
            <a :href="element.lien" target="_blank" class="house-card-link">
              <div class="house-card">
                <div class="rank-controls handle">
                  <i class="fa-solid fa-grip-vertical"></i>
                  <span class="rank-num">#{{ index + 1 }}</span>
                </div>
                
                <div class="image-container">
                  <img 
                  :src="element.image || 'https://via.placeholder.com/400x300?text=Pas+d\'image'" 
                  class="house-img"
                  >
                </div>
                
                <div class="house-info">
                  <div class="house-header">
                    <div class="title-group">
                      <h3>{{ element.titre }}</h3>
                      <p class="location">
                        <i class="fa-solid fa-location-dot"></i> {{ element.lieu }}
                      </p>
                    </div>
                    <span class="price">{{ formatPrix(element.prix) }}€</span>
                  </div>
                  
                  <div class="stats">
                    <span><i class="fa-solid fa-bed"></i> {{ element.chambres }} ch.</span>
                    <span><i class="fa-solid fa-house-chimney"></i> {{ element.surface }}m²</span>                    
                  </div>
                  
                  <p v-if="element.commentaire" class="note">"{{ element.commentaire }}"</p>
                  
                  <div class="actions">
                    <button @click="openModal(element)" class="btn-action btn-edit"><i class="fa-solid fa-pen"></i></button>
                    <button @click="remove(index)" class="btn-action btn-delete"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </template>
      </draggable>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ form.id ? 'Modifier la maison' : 'Nouvelle pépite' }}</h2>
          <button class="close-modal" @click="showModal = false">&times;</button>
        </div>
        
        <div class="form-grid">
          <div class="input-group"><label>Titre</label><input v-model="form.titre" placeholder="Ex: Maison Bourges"></div>
          <div class="row">
            <div class="input-group"><label>Prix (€)</label><input v-model="form.prix"></div>
            <div class="input-group"><label>Lieu</label><input v-model="form.lieu"></div>
          </div>
          <div class="row">
            <div class="input-group"><label>Chambres</label><input v-model="form.chambres" type="number"></div>
            <div class="input-group"><label>Surface (m²)</label><input v-model="form.surface"></div>
          </div>
          <div class="input-group"><label>Lien</label><input v-model="form.lien"></div>
          <div class="input-group"><label>URL Image</label><input v-model="form.image"></div>
          <div class="input-group"><label>Commentaire</label><textarea v-model="form.commentaire"></textarea></div>
        </div>

        <div class="modal-footer">
          <button @click="showModal = false" class="btn btn-secondary">Annuler</button>
          <button @click="save" class="btn btn-primary">Enregistrer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable';

export default {
  components: { draggable },
  data() {
    return {
      isAuth: false,
      password: '',
      maisons: [],
      showModal: false,
      form: { id: null, titre: '', prix: '', lieu: '', chambres: 0, surface: '', lien: '', image: '', commentaire: '' },
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/maisons',
    };
  },
  async mounted() {
    const savedPwd = localStorage.getItem('maison_auth_pwd');
    if (savedPwd) {
      const isValid = await this.verifyPassword(savedPwd);
      if(isValid) {
        this.password = savedPwd;
        this.isAuth = true;
        this.fetchMaisons();
        return;
      }

      this.logout();
    }
  },
  methods: {
    async verifyPassword(pwd) {
      try {
        const authUrl = this.apiUrl.replace('/maisons', '/verify-auth');
        const res = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd })
        });
        const data = await res.json();
        return data.success;
      } catch (e) {
        console.error("Erreur auth", e);
        return false;
      }
    },
    logout() {
      localStorage.removeItem('maison_auth_pwd');
      this.isAuth = false;
      this.password = '';
      this.maisons = [];
    },
    formatPrix(valeur) {
      if (!valeur) return "0";
      // Transforme en nombre si c'est une chaîne, puis formate
      return Number(valeur).toLocaleString('fr-FR');
    },
    async login() {
      // On tente de charger les maisons avec le mot de passe saisi
      try {
        const res = await fetch(this.apiUrl);
        if (res.ok) {
          this.maisons = await res.json();
          this.isAuth = true; // Si le serveur répond, c'est qu'on a accès (ou gère un test de mdp ici)
          localStorage.setItem('maison_pwd', this.password); // Optionnel: pour ne pas retaper à chaque fois
        }
      } catch (e) {
        alert("Erreur de connexion");
      }
    },
    async fetchMaisons() {
      try {
        const res = await fetch(this.apiUrl);
        this.maisons = await res.json();
      } catch (error) { console.error(error); }
    },
    async syncWithBackend() {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: this.password, // Envoi du mot de passe saisi au login
            data: this.maisons
          })
        });

        if (response.status === 401) {
          alert("Session expirée ou mot de passe incorrect");
          this.isAuth = false;
        }
      } catch (error) {
        console.error("Erreur synchro:", error);
      }
    },
    openModal(item = null) {
      if (item) { this.form = { ...item }; } 
      else { this.form = { id: null, titre: '', prix: '', lieu: '', chambres: 0, surface: '', lien: '', image: '', commentaire: '' }; }
      this.showModal = true;
    },
    async save() {
      if (!this.form.titre) return;
      if (this.form.id) {
        const idx = this.maisons.findIndex(m => m.id === this.form.id);
        this.maisons[idx] = { ...this.form };
      } else { this.maisons.push({ ...this.form, id: Date.now() }); }
      await this.syncWithBackend();
      this.showModal = false;
    },
    async remove(index) {
      if (confirm('Supprimer ?')) {
        this.maisons.splice(index, 1);
        await this.syncWithBackend();
      }
    }
  }
};
</script>

<style scoped>
/* --- VARIABLES & BASE --- */
:root {
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --bg: #f8fafc;
  --white: #ffffff;
  --border: #e2e8f0;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --header-height: 80px;
}

.container { 
  max-width: 1000px; 
  margin: 0 auto; 
  padding: 20px;
  /* On ajoute un padding-top pour compenser le header fixe */
  padding-top: calc(var(--header-height) + 20px); 
  font-family: 'Inter', system-ui, sans-serif;
  background-color: var(--bg);
  min-height: 100vh;
}

/* --- HEADER FIXE --- */
.main-header { 
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  z-index: 1000;
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 0 5%;
  border-bottom: 1px solid var(--border);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.main-header h1 { font-style: italic; font-weight: 800; font-size: 1.5rem; margin: 0; }
.main-header h1 span { color: var(--primary); }

/* --- BOUTONS STYLISÉS --- */
.btn { 
  border: none; 
  font-weight: 700; 
  cursor: pointer; 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  gap: 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.btn-primary { 
  background: var(--primary); 
  color: white; 
  padding: 12px 20px;
  box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.39);
}

.btn-primary:hover { 
  background: var(--primary-hover);
  transform: translateY(-2px); 
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.23);
}

.btn-add-house { 
  height: 45px;
}

/* --- CARDS RESPONSIVE --- */
.house-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 24px;
  display: flex;
  margin-bottom: 24px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.house-card:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.rank-controls { 
  background: #f1f5f9; 
  width: 50px; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  border-right: 1px solid var(--border); 
  color: #94a3b8; 
}

.image-container { 
  width: 250px; 
  height: 180px; 
  overflow: hidden; 
  flex-shrink: 0; 
}

.house-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
.house-card:hover .house-img { transform: scale(1.05); }

.house-info { padding: 20px; flex: 1; display: flex; flex-direction: column; }
.price { color: var(--primary); font-weight: 900; font-size: 1.4rem; }
.location { color: var(--text-muted); font-size: 0.9rem; margin: 5px 0; }

/* --- ACTIONS (EDIT/DELETE) --- */
.actions { margin-top: auto; display: flex; justify-content: flex-end; gap: 10px; }
.btn-action { 
  background: #f8fafc; 
  border: 1px solid var(--border); 
  width: 42px; height: 42px; 
  border-radius: 10px; 
  cursor: pointer; 
  transition: all 0.2s; 
  color: #64748b; 
}
.btn-edit:hover { background: #fffbeb; color: #d97706; border-color: #fde68a; }
.btn-delete:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

/* --- MOBILE OPTIMIZATION ( < 768px ) --- */
@media (max-width: 768px) {
  .container { padding-top: calc(var(--header-height) + 10px); }

  .main-header { padding: 0 15px; }
  .main-header h1 { font-size: 1.2rem; }
  
  /* On cache le texte du bouton sur mobile pour ne laisser que le + */
  .btn-add-house span { display: none; }
  .btn-add-house { width: 45px; border-radius: 50%; padding: 0; }

  .house-card { 
    flex-direction: column; /* Empilage vertical */
    border-radius: 20px;
  }

  .rank-controls { 
    width: 100%; 
    height: 40px; 
    flex-direction: row; 
    border-right: none; 
    border-bottom: 1px solid var(--border); 
    gap: 10px;
  }

  .image-container { 
    width: 100%; 
    height: 220px; 
  }

  .house-info { padding: 15px; }
  .price { font-size: 1.3rem; }
  
  .stats { 
    display: grid; 
    grid-template-columns: 1fr 1fr 1fr; 
    gap: 10px; 
    margin-top: 15px;
  }
}

/* --- LOGIN (Optionnel mais propre) --- */
.login-box {
  padding: 40px 20px;
  /* Le login n'a pas besoin du padding-top du header fixe */
  margin: 15vh auto; 
}
/* --- Nouveaux styles pour le lien global --- */
.house-card-link {
  text-decoration: none;
  color: inherit; /* Garde vos couleurs de texte */
  display: block;
  margin-bottom: 24px;
}

.house-card {
  margin-bottom: 0; /* On gère la marge sur le lien maintenant */
  cursor: pointer;
}

/* Effet de zoom sur l'image au survol de la carte-lien */
.house-card-link:hover .house-img {
  transform: scale(1.05);
}

.house-card-link:hover .house-card {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  border-color: var(--primary); /* Optionnel : colore la bordure au survol */
}

/* On s'assure que les boutons d'action restent au-dessus et cliquables */
.actions {
  position: relative;
  z-index: 10;
}

/* Correction pour mobile : s'assurer que le lien prend bien toute la largeur */
@media (max-width: 768px) {
  .house-card-link {
    margin-bottom: 20px;
  }
}
</style>