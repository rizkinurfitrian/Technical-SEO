// src/stores/useAuditStore.ts
import { defineStore } from 'pinia';
import type { SeoAuditResult } from '../types/seo';

export const useAuditStore = defineStore('audit', {
  state: () => ({
    // Menyimpan status pemuatan saat API sedang melakukan scraping
    isLoading: false as boolean,
    
    // Menyimpan pesan error jika proses audit gagal
    error: null as string | null,
    
    // Menyimpan objek hasil audit utama berdasarkan interface TypeScript
    auditResult: null as SeoAuditResult | null,
  }),

  getters: {
    // Getter untuk memeriksa apakah data audit sudah tersedia
    hasResult: (state) => state.auditResult !== null,
    
    // Getter untuk menghitung total link yang ditemukan
    totalLinks: (state) => state.auditResult?.links.length || 0,
    
    // Getter untuk memfilter schema yang tidak valid
    invalidSchemas: (state) => {
      return state.auditResult?.schemas.filter(s => !s.isValid) || [];
    }
  },

  actions: {
    // Fungsi utama untuk memicu proses audit ke backend proxy
    async fetchAuditData(url: string) {
      this.isLoading = true;
      this.error = null;
      this.auditResult = null;

      try {
        // PERHATIAN: URL ini adalah endpoint lokal Node.js Proxy yang akan kita buat di langkah berikutnya
        const response = await fetch(`http://localhost:3000/api/audit?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
          throw new Error('Gagal melakukan audit pada URL tersebut. Pastikan URL valid.');
        }

        const data: SeoAuditResult = await response.json();
        
        // Simpan hasil ke state global
        this.auditResult = data;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan sistem.';
        console.error('Audit Error:', err);
      } finally {
        this.isLoading = false;
      }
    },

    // Fungsi untuk membersihkan dashboard jika ingin melakukan audit ulang
    resetAudit() {
      this.auditResult = null;
      this.error = null;
      this.isLoading = false;
    }
  }
});