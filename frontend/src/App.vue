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
          <i class="fa-solid fa-plus"></i> Ajouter une maison
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
                <span class="price">{{ element.prix }}€</span>
              </div>

              <div class="stats">
                <span><i class="fa-solid fa-bed"></i> {{ element.chambres }} ch.</span>
                <span><i class="fa-solid fa-house-chimney"></i> {{ element.surface }}m²</span>
                <a :href="element.lien" target="_blank" class="link-icon">
                  <i class="fa-solid fa-up-right-from-square"></i>
                </a>
              </div>
              
              <p v-if="element.commentaire" class="note">"{{ element.commentaire }}"</p>

              <div class="actions">
                <button @click="openModal(element)" class="btn-action btn-edit"><i class="fa-solid fa-pen"></i></button>
                <button @click="remove(index)" class="btn-action btn-delete"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
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
  methods: {
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
:root {
  --primary: #4f46e5;
  --bg: #f8fafc;
  --border: #e2e8f0;
}

.container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; font-family: sans-serif; }

/* --- LOGIN DESIGN --- */
.login-box {
  background: white;
  padding: 60px 40px;
  border-radius: 40px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1);
  max-width: 450px;
  margin: 10vh auto;
  text-align: center;
}

.login-content h1 { font-size: 2.5rem; margin-bottom: 8px; font-weight: 900; }
.login-content h1 span { color: var(--primary); }
.login-subtitle { color: #94a3b8; margin-bottom: 40px; font-size: 1rem; }

.login-form { display: flex; flex-direction: column; gap: 15px; align-items: center; }

.styled-input {
  width: 100%;
  max-width: 300px;
  padding: 15px 20px;
  border: 2px solid #f1f5f9;
  border-radius: 15px;
  background: #f8fafc;
  outline: none;
  transition: all 0.3s;
  font-size: 1rem;
}

.styled-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }

.btn-login { width: 100%; max-width: 300px; padding: 15px; font-size: 1.1rem; border-radius: 15px; }

/* --- HEADER & BOUTON AJOUT --- */
.main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
.main-header h1 { font-style: italic; font-weight: 800; }
.main-header h1 span { color: var(--primary); }

.btn-add-house { 
  width: auto !important; /* Force la largeur auto */
  padding: 12px 24px !important; 
  flex: none !important;
  font-size: 0.95rem;
}

/* --- CARDS --- */
.house-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 24px;
  display: flex;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.rank-controls { background: #f8fafc; width: 50px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 1px solid var(--border); color: #cbd5e1; }
.handle { cursor: grab; }

.image-container { width: 220px; height: 160px; overflow: hidden; flex-shrink: 0; }
.house-img { width: 100%; height: 100%; object-fit: cover; }

.house-info { padding: 20px 25px; flex: 1; display: flex; flex-direction: column; }
.house-header { display: flex; justify-content: space-between; align-items: flex-start; }
.price { color: var(--primary); font-weight: 900; font-size: 1.5rem; }
.stats { margin-top: 15px; display: flex; gap: 20px; font-size: 0.9rem; color: #475569; font-weight: 600; }
.note { font-style: italic; font-size: 0.85rem; background: #f1f5f9; padding: 12px; border-radius: 12px; margin-top: 15px; color: #64748b; }

/* --- ACTIONS --- */
.actions { margin-top: auto; display: flex; justify-content: flex-end; gap: 10px; }
.btn-action { background: #f8fafc; border: 1px solid #e2e8f0; width: 40px; height: 40px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: #94a3b8; }
.btn-edit:hover { background: #fffbeb; color: #d97706; border-color: #fde68a; }
.btn-delete:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

/* --- MODAL & BUTTONS --- */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-content { background: white; width: 95%; max-width: 550px; padding: 35px; border-radius: 30px; }
.row { display: flex; gap: 15px; }
.row .input-group { flex: 1; }
.input-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; text-align: left; }
.input-group label { font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
.input-group input, .input-group textarea { padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }

.btn { border: none; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4); }
.btn-secondary { background: #f1f5f9; color: #64748b; padding: 12px 20px; border-radius: 12px; }
.close-modal { background: none; border: none; font-size: 2rem; cursor: pointer; color: #cbd5e1; }
</style>