<script setup lang="ts">
import { ref } from 'vue'
import { useAuditStore } from './stores/useAuditStore'

const auditStore = useAuditStore()
const targetUrl = ref('')

const submitAudit = () => {
  if (!targetUrl.value) {
    alert('Harap masukkan URL terlebih dahulu!')
    return
  }
  
  let urlToAudit = targetUrl.value
  if (!urlToAudit.startsWith('http')) {
    urlToAudit = `https://${urlToAudit}`
  }

  auditStore.fetchAuditData(urlToAudit)
}

// Helper untuk menghitung persentase internal link
const getInternalLinkPercentage = () => {
  if (!auditStore.auditResult || auditStore.totalLinks === 0) return 0;
  const internalLinks = auditStore.auditResult.links.filter(l => l.isInternal).length;
  return Math.round((internalLinks / auditStore.totalLinks) * 100);
}
</script>

<template>
  <main class="dashboard-container">
    <header>
      <h1>Technical SEO & Schema Analyzer</h1>
      <p>Masukkan URL halaman untuk melakukan audit Meta-Data, Schema, dan Internal Linking.</p>
    </header>

    <section class="search-section">
      <input 
        v-model="targetUrl" 
        type="url" 
        placeholder="Contoh: https://website.com/artikel-target" 
        @keyup.enter="submitAudit"
      />
      <button @click="submitAudit" :disabled="auditStore.isLoading">
        {{ auditStore.isLoading ? 'Menganalisis...' : 'Mulai Audit' }}
      </button>
    </section>

    <div v-if="auditStore.error" class="error-alert">
      ⚠️ {{ auditStore.error }}
    </div>

    <section v-if="auditStore.hasResult" class="results-wrapper">
      <div class="results-header">
        <h2>Hasil Audit untuk: <a :href="auditStore.auditResult?.targetUrl" target="_blank">{{ auditStore.auditResult?.targetUrl }}</a></h2>
        <button @click="auditStore.resetAudit()" class="btn-reset">Reset Audit</button>
      </div>

      <div class="dashboard-grid">
        
        <div class="card">
          <div class="card-header">
            <h3>🏷️ Meta Title & Description</h3>
          </div>
          <div class="card-body">
            <div class="data-group">
              <label>Meta Title <span :class="auditStore.auditResult?.meta.isTitleOptimal ? 'badge-success' : 'badge-warning'">{{ auditStore.auditResult?.meta.titleLength }} Karakter</span></label>
              <p class="data-value">{{ auditStore.auditResult?.meta.title || 'Tidak ditemukan' }}</p>
              <small v-if="!auditStore.auditResult?.meta.isTitleOptimal" class="text-hint">Optimal: 50-60 karakter.</small>
            </div>
            
            <div class="data-group">
              <label>Meta Description <span :class="auditStore.auditResult?.meta.isDescriptionOptimal ? 'badge-success' : 'badge-warning'">{{ auditStore.auditResult?.meta.descriptionLength }} Karakter</span></label>
              <p class="data-value">{{ auditStore.auditResult?.meta.description || 'Tidak ditemukan' }}</p>
              <small v-if="!auditStore.auditResult?.meta.isDescriptionOptimal" class="text-hint">Optimal: 150-160 karakter.</small>
            </div>

            <div class="data-group-inline">
              <div>
                <label>Robots Directive:</label>
                <span class="code-badge">{{ auditStore.auditResult?.meta.robots || 'Tidak ada' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>🧩 Structured Data (Schema)</h3>
          </div>
          <div class="card-body">
            <div v-if="auditStore.auditResult?.schemas.length === 0" class="empty-state">
              Tidak ada Schema JSON-LD yang terdeteksi di halaman ini.
            </div>
            <ul v-else class="schema-list">
              <li v-for="(schema, index) in auditStore.auditResult?.schemas" :key="index" class="schema-item">
                <div class="schema-info">
                  <span class="schema-type">{{ schema.type }}</span>
                  <span v-if="schema.isValid" class="status-icon success">✔️ Terdeteksi</span>
                  <span v-else class="status-icon error">❌ Invalid</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="card link-card">
          <div class="card-header">
            <h3>🔗 Link Analysis</h3>
            <span class="badge-neutral">Total: {{ auditStore.totalLinks }} Links</span>
          </div>
          <div class="card-body">
            <div class="link-stats">
              <div class="stat-box">
                <span class="stat-value">{{ getInternalLinkPercentage() }}%</span>
                <span class="stat-label">Internal Link Ratio</span>
              </div>
            </div>
            
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Anchor Text</th>
                    <th>Tipe</th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(link, index) in auditStore.auditResult?.links" :key="index">
                    <td class="anchor-text">{{ link.anchorText || '[Tanpa Teks]' }}</td>
                    <td>
                      <span :class="link.isInternal ? 'badge-internal' : 'badge-external'">
                        {{ link.isInternal ? 'Internal' : 'External' }}
                      </span>
                    </td>
                    <td class="link-url"><a :href="link.url" target="_blank" title="Buka URL">{{ link.url }}</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </section>
  </main>
</template>

<style scoped>
/* GENERAL STYLES */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: clamp(1.5rem, 4vw, 2rem); /* Ukuran font dinamis */
}

/* SEARCH SECTION */
.search-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

input {
  flex: 1;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

input:focus {
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.2);
}

button {
  padding: 0.85rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

button:hover:not(:disabled) {
  background-color: #35966a;
}

button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

/* DASHBOARD LAYOUT */
.results-wrapper {
  animation: fadeIn 0.5s ease-in-out;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
  gap: 1rem;
}

.results-header h2 {
  font-size: clamp(1.1rem, 3vw, 1.25rem);
  color: #2c3e50;
  margin: 0;
  word-break: break-all; /* Mencegah URL panjang merusak layout */
}

.btn-reset {
  background-color: #dc3545;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.btn-reset:hover {
  background-color: #c82333;
}

/* GRID RESPONSIVE - Menggunakan CSS Clamp/Minmax cerdas */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 350px), 1fr));
  gap: 1.5rem;
  align-items: start;
}

/* CARDS */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #eaeaeb;
  overflow: hidden;
}

.card-header {
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eaeaeb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2c3e50;
}

.card-body {
  padding: 1.5rem;
}

/* DATA TYPOGRAPHY & BADGES */
.data-group {
  margin-bottom: 1.5rem;
}

.data-group label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.data-value {
  margin: 0;
  padding: 0.75rem;
  background: #f1f3f5;
  border-radius: 4px;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #333;
  word-break: break-word;
}

.text-hint {
  display: block;
  margin-top: 0.25rem;
  color: #868e96;
  font-size: 0.8rem;
}

.code-badge {
  background: #282c34;
  color: #abb2bf;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
}

.badge-success { background: #d4edda; color: #155724; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; }
.badge-warning { background: #fff3cd; color: #856404; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; }
.badge-neutral { background: #e2e3e5; color: #383d41; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }
.badge-internal { background: #cce5ff; color: #004085; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;}
.badge-external { background: #e2e3e5; color: #383d41; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;}

/* SCHEMA LIST */
.schema-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.schema-item {
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  background: #fafafa;
}

.schema-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.schema-type {
  font-weight: 600;
  color: #1971c2;
}

/* LINK TABLE */
.link-card {
  grid-column: 1 / -1; 
}

.link-stats {
  margin-bottom: 1rem;
}

.stat-box {
  display: inline-block;
  background: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #42b883;
  margin-right: 0.5rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
}

.table-container {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: auto; /* Memastikan tabel bisa di-scroll horizontal di HP */
  border: 1px solid #e9ecef;
  border-radius: 6px;
  -webkit-overflow-scrolling: touch; /* Kelancaran scroll di iOS */
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
  min-width: 600px; /* Mencegah kolom tabel terlalu menyusut di HP */
}

thead {
  background-color: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 1;
}

th, td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
}

.anchor-text {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.link-url {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.link-url a {
  color: #0056b3;
  text-decoration: none;
}

.link-url a:hover {
  text-decoration: underline;
}

/* ANIMATIONS */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* =========================================
   MEDIA QUERIES UNTUK TAMPILAN MOBILE (HP)
   ========================================= */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }
  
  .search-section {
    flex-direction: column; /* Input dan tombol ditumpuk ke bawah */
    padding: 1rem;
  }

  button {
    width: 100%; /* Tombol memenuhi lebar layar */
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-reset {
    width: 100%;
    text-align: center;
  }

  .card-body {
    padding: 1rem;
  }

  .stat-box {
    display: block;
    text-align: center;
  }
}
</style>