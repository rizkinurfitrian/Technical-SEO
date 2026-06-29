<template>
  <div class="dashboard-container">
    <header class="text-center header-section">
      <h1 class="logo-title"><span class="icon">📈</span> Technical SEO & Schema Analyzer</h1>
      <p class="subtitle">Masukkan URL halaman untuk melakukan audit mendalam pada Meta-Data, Schema, dan Internal Linking.</p>
      
      <div class="search-box">
        <span class="url-icon">🌐</span>
        <input 
          v-model="inputUrl" 
          type="text" 
          placeholder="https://..." 
          @keyup.enter="runAudit" 
        />
        <button class="btn-audit" @click="runAudit" :disabled="isLoading">
          {{ isLoading ? '⏳ Memproses...' : '🔍 Mulai Audit' }}
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="text-center mt-4">
      <p>Sedang menganalisis halaman dengan Google Lighthouse, mohon tunggu sebentar...</p>
    </div>

    <div class="summary-bar" v-if="auditData && !isLoading">
      <div class="summary-text">
        Hasil Audit untuk: <a :href="auditData.targetUrl" target="_blank" class="url-link">{{ auditData.targetUrl }}</a>
      </div>
      <div class="summary-actions">
        <span class="badge badge-green">12 Aman</span>
        <span class="badge badge-yellow">3 Peringatan</span>
        <span class="badge badge-red">1 Kritis</span>
        
        <div class="divider"></div>
        <button class="btn-reset" @click="resetAudit">↻ Reset Audit</button>
      </div>
    </div>

    <div class="main-grid" v-if="auditData && !isLoading">
      
      <div class="left-col">
        <AuditCard>
          <template #header>
            <div class="card-title">📄 Meta Title & Description</div>
            <span :class="auditData.meta.isTitleOptimal && auditData.meta.isDescriptionOptimal ? 'badge badge-green' : 'badge badge-yellow-outline'">
              {{ auditData.meta.isTitleOptimal && auditData.meta.isDescriptionOptimal ? 'Optimal' : 'Perlu Optimasi' }}
            </span>
          </template>
          
          <div class="meta-item">
            <label class="font-semibold">Meta Title</label>
            <p class="meta-text">{{ auditData.meta.title || 'Tidak ada tag title ditemukan.' }}</p>
            <div class="progress-bar-container">
              <div class="progress-fill" :class="auditData.meta.isTitleOptimal ? 'green' : 'red'" :style="{ width: Math.min((auditData.meta.titleLength / 60) * 100, 100) + '%' }"></div>
            </div>
            <div class="meta-stats" :class="auditData.meta.isTitleOptimal ? 'text-green' : 'text-red'">
              {{ auditData.meta.titleLength }} Karakter <span class="optimal-text">OPTIMAL: 50-60</span>
            </div>
          </div>

          <div class="meta-item mt-4">
            <label class="font-semibold">Meta Description</label>
            <p class="meta-text">{{ auditData.meta.description || 'Tidak ada meta description ditemukan.' }}</p>
            <div class="progress-bar-container">
              <div class="progress-fill" :class="auditData.meta.isDescriptionOptimal ? 'green' : 'red'" :style="{ width: Math.min((auditData.meta.descriptionLength / 160) * 100, 100) + '%' }"></div>
            </div>
            <div class="meta-stats" :class="auditData.meta.isDescriptionOptimal ? 'text-green' : 'text-red'">
              {{ auditData.meta.descriptionLength }} Karakter <span class="optimal-text">OPTIMAL: 120-160</span>
            </div>
          </div>
        </AuditCard>

        <div class="perf-row" v-if="auditData.performance">
          
          <AuditCard>
             <template #header><div class="card-title">♿ Accessibility</div></template>
             <div class="gauge-container">
               <div class="gauge" :style="{ background: `conic-gradient(#10b981 ${auditData.performance.accessibilityScore}%, #e5e7eb 0)` }">
                 <span class="gauge-value">{{ auditData.performance.accessibilityScore }}</span>
               </div>
             </div>
             <div class="perf-stats mt-4 text-sm">
               <div class="flex justify-between border-b py-2">
                 <span class="text-gray">Contrast Ratio</span>
                 <span class="text-green font-semibold">Lulus</span>
               </div>
             </div>
          </AuditCard>

          <AuditCard>
             <template #header><div class="card-title">⚡ Performance</div></template>
             <div class="gauge-container">
               <div class="gauge" :style="{ background: `conic-gradient(${auditData.performance.performanceScore >= 80 ? '#10b981' : auditData.performance.performanceScore >= 50 ? '#f59e0b' : '#ef4444'} ${auditData.performance.performanceScore}%, #e5e7eb 0)` }">
                 <span class="gauge-value">{{ auditData.performance.performanceScore }}</span>
               </div>
             </div>
             <div class="perf-stats mt-4 text-sm">
               <div class="flex justify-between border-b py-2">
                 <span class="text-gray">LCP (Largest Content)</span>
                 <span class="font-semibold">{{ auditData.performance.lcp }}</span>
               </div>
               <div class="flex justify-between py-2">
                 <span class="text-gray">CLS (Shift)</span>
                 <span class="font-semibold text-green">{{ auditData.performance.cls }}</span>
               </div>
             </div>
          </AuditCard>
          
        </div>
      </div>

      <div class="right-col">
        <AuditCard>
          <template #header>
            <div class="card-title">🧩 Structured Data (Schema)</div>
            <span class="badge badge-gray-outline">{{ auditData.schemas.length }} Tipe</span>
          </template>
          
          <ul class="schema-list" v-if="auditData.schemas.length > 0">
            <li v-for="(schema, index) in auditData.schemas" :key="index">
              <span class="schema-tag" :class="{ 'error': !schema.isValid }">{{ schema.type }}</span> 
              <span :class="schema.isValid ? 'text-green' : 'text-red'">
                {{ schema.isValid ? '✔️ Valid' : '❌ Error' }}
              </span>
            </li>
          </ul>
          <p v-else class="text-gray text-center mt-4">Tidak ada JSON-LD Schema ditemukan.</p>
        </AuditCard>

        <div class="mt-4">
          <AuditCard>
            <template #header><div class="card-title">🔗 Internal Linking</div></template>
            <div class="link-boxes">
              <div class="link-box">
                <div class="number">{{ auditData.links.filter((l: any) => l.isInternal).length }}</div>
                <div class="label">Inbound</div>
              </div>
              <div class="link-box">
                <div class="number">{{ auditData.links.filter((l: any) => !l.isInternal).length }}</div>
                <div class="label">Outbound</div>
              </div>
            </div>
          </AuditCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import AuditCard from './components/AuditCard.vue';

const inputUrl = ref('');
const isLoading = ref(false);
const auditData = ref<any>(null);

watch(inputUrl, (newValue) => {
  if (newValue.trim() === '') {
    auditData.value = null;
  }
});

const resetAudit = () => {
  inputUrl.value = '';
  auditData.value = null;
};

const runAudit = async () => {
  if (!inputUrl.value) {
    alert("Masukkan URL terlebih dahulu!");
    return;
  }

  isLoading.value = true;
  auditData.value = null;

  try {
    const response = await fetch(`http://localhost:3000/api/audit?url=${encodeURIComponent(inputUrl.value)}`);
    if (!response.ok) throw new Error("Gagal mengambil data");
    
    const result = await response.json();
    auditData.value = result;
  } catch (error) {
    console.error("Gagal melakukan audit:", error);
    alert("Terjadi kesalahan. Pastikan server lokal (Node.js) berjalan.");
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* GENERAL STYLES */
.dashboard-container { max-width: 1100px; margin: 0 auto; padding: 40px 20px; font-family: 'Inter', sans-serif; color: #374151; }
.text-center { text-align: center; }
.mt-4 { margin-top: 1.5rem; }
.font-semibold { font-weight: 600; display: block; margin-bottom: 5px; }
.text-green { color: #10b981; font-weight: 500; }
.text-red { color: #ef4444; font-weight: 500; }
.text-gray { color: #6b7280; }

/* FLEX & UTILITIES BARU */
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.border-b { border-bottom: 1px solid #f3f4f6; }
.py-2 { padding: 8px 0; }
.text-sm { font-size: 0.875rem; }

/* HEADER & SEARCH */
.logo-title { font-size: 1.8rem; font-weight: 700; color: #111827; }
.subtitle { color: #6b7280; margin: 10px 0 24px 0; }
.search-box { display: flex; max-width: 700px; margin: 0 auto; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden; }
.search-box .url-icon { padding: 12px 16px; background: #f9fafb; border-right: 1px solid #d1d5db; }
.search-box input { flex: 1; padding: 12px; border: none; outline: none; }
.search-box .btn-audit { background: #10b981; color: white; border: none; padding: 0 24px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.search-box .btn-audit:disabled { background: #9ca3af; cursor: not-allowed; }

/* SUMMARY BAR */
.summary-bar { display: flex; justify-content: space-between; align-items: center; margin: 30px 0 20px 0; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; }
.url-link { color: #10b981; text-decoration: none; font-weight: 500; word-break: break-all; }
.summary-actions { display: flex; align-items: center; gap: 10px; }
.badge { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.badge-green { background: #d1fae5; color: #065f46; }
.badge-yellow { background: #fef3c7; color: #92400e; }
.badge-red { background: #fee2e2; color: #991b1b; }
.badge-yellow-outline { border: 1px solid #f59e0b; color: #d97706; background: #fffbeb; }
.badge-gray-outline { border: 1px solid #d1d5db; color: #4b5563; }
.divider { width: 1px; height: 24px; background: #d1d5db; margin: 0 5px; }
.btn-reset { background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: 0.2s; }
.btn-reset:hover { background: #fef2f2; }

/* LAYOUT GRIDS */
.main-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; align-items: start; }
.perf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }

/* PROGRESS BARS */
.progress-bar-container { width: 100%; height: 6px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 8px 0; }
.progress-fill { height: 100%; transition: width 0.5s ease; }
.progress-fill.green { background: #10b981; }
.progress-fill.red { background: #ef4444; }
.meta-stats { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; }
.optimal-text { color: #9ca3af; font-size: 0.7rem; }

/* GAUGE & STATS */
.gauge-container { display: flex; justify-content: center; padding: 20px 0; }
.gauge { 
  width: 100px; 
  height: 100px; 
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  position: relative; 
}
.gauge::before { 
  content: ""; 
  position: absolute; 
  inset: 10px; 
  background: white; 
  border-radius: 50%; 
}
.gauge-value {
  position: absolute;
  z-index: 1;
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

/* LISTS & BOXES */
.schema-list { list-style: none; padding: 0; margin: 0; }
.schema-list li { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: 0.9rem; }
.schema-tag { background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
.schema-tag.error { background: #fee2e2; color: #ef4444; }
.link-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.link-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
.link-box .number { font-size: 2rem; font-weight: 700; color: #111827; }

@media (max-width: 900px) {
  .main-grid { grid-template-columns: 1fr; }
  .summary-bar { flex-direction: column; align-items: flex-start; gap: 15px; }
  .summary-actions { flex-wrap: wrap; }
}
</style>