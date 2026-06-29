import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
app.use(cors());

app.get('/api/audit', async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL target wajib diisi.' });
  }

  try {
    // 1. Ambil HTML Halaman untuk Meta, Link, dan Schema
    const { data: html } = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const $ = cheerio.load(html);
    const baseUrl = new URL(targetUrl).origin;

    // --- EKSTRAKSI META ---
    const title = $('title').text() || null;
    const description = $('meta[name="description"]').attr('content') || null;
    const meta = {
      title,
      description,
      titleLength: title ? title.length : 0,
      descriptionLength: description ? description.length : 0,
      isTitleOptimal: title ? (title.length >= 50 && title.length <= 60) : false,
      isDescriptionOptimal: description ? (description.length >= 120 && description.length <= 160) : false,
    };

    // --- EKSTRAKSI LINKS ---
    const links = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
        let fullUrl = href.startsWith('/') ? `${baseUrl}${href}` : href;
        links.push({ url: fullUrl, isInternal: fullUrl.startsWith(baseUrl) });
      }
    });

    // --- EKSTRAKSI SCHEMA ---
    const schemas = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html());
        const process = (s) => schemas.push({ type: s['@type'] || 'Unknown', isValid: !!s['@type'] });
        Array.isArray(json) ? json.forEach(process) : process(json);
      } catch (err) {}
    });

    // --- GOOGLE PAGESPEED INSIGHTS API ---
    // Siapkan nilai default jika API gagal/timeout
    let performanceData = {
      accessibilityScore: 0,
      performanceScore: 0,
      lcp: "N/A",
      cls: "N/A"
    };

    try {

      const GOOGLE_API_KEY = 'AIzaSyAkXYIyKkfaaMdvgwubG-xpADMfiubNGXg';

      // Memanggil API Lighthouse dari Google (Strategi: Desktop)
      const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&category=PERFORMANCE&category=ACCESSIBILITY&strategy=desktop&key=${GOOGLE_API_KEY}`;
      

      const psiResponse = await axios.get(psiUrl, {
        timeout: 30000 
      });
      const lighthouse = psiResponse.data.lighthouseResult;

      

      performanceData = {
        // Google mereturn skor 0.0 - 1.0, kita kalikan 100
        accessibilityScore: Math.round(lighthouse.categories.accessibility.score * 100),
        performanceScore: Math.round(lighthouse.categories.performance.score * 100),
        lcp: lighthouse.audits['largest-contentful-paint'].displayValue,
        cls: lighthouse.audits['cumulative-layout-shift'].displayValue
      };
    } catch (psiError) {
      console.error('Gagal mengambil data PageSpeed:', psiError.message);
      // Aplikasi tetap berjalan meski PageSpeed gagal
    }

    // --- MENYUSUN RESPON AKHIR ---
    res.json({
      targetUrl,
      scrapedAt: new Date().toISOString(),
      meta,
      links,
      schemas,
      performance: performanceData
    });

  } catch (error) {
    res.status(500).json({ error: 'Gagal melakukan scraping', details: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server Proxy SEO berjalan di http://localhost:${PORT}`);
});