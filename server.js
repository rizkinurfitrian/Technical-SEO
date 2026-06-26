// server.js
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();

// Mengizinkan Vue frontend untuk mengakses server ini
app.use(cors());

app.get('/api/audit', async (req, res) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL target wajib diisi.' });
  }

  try {
    // 1. Mengunduh HTML dari URL target
    const { data: html } = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // 2. Memuat HTML ke Cheerio untuk ekstraksi
    const $ = cheerio.load(html);
    const parsedUrl = new URL(targetUrl);
    const baseUrl = parsedUrl.origin;

    // --- EKSTRAKSI META DATA ---
    const title = $('title').text() || null;
    const description = $('meta[name="description"]').attr('content') || null;
    const robots = $('meta[name="robots"]').attr('content') || null;
    const canonical = $('link[rel="canonical"]').attr('href') || null;

    const meta = {
      title,
      description,
      titleLength: title ? title.length : 0,
      descriptionLength: description ? description.length : 0,
      isTitleOptimal: title ? (title.length >= 50 && title.length <= 60) : false,
      isDescriptionOptimal: description ? (description.length >= 150 && description.length <= 160) : false,
      robots,
      canonical
    };

    // --- EKSTRAKSI LINKS ---
    const links = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      const anchorText = $(el).text().trim();
      
      if (href && !href.startsWith('javascript:')) {
        let fullUrl = href;
        // Menangani relative URL (contoh: /about-us)
        if (href.startsWith('/')) {
           fullUrl = `${baseUrl}${href}`;
        }
        
        const isInternal = fullUrl.startsWith(baseUrl);
        
        links.push({
          url: fullUrl,
          anchorText,
          isInternal,
          status: null // Pengecekan status HTTP bisa ditambahkan nanti agar tidak memperlambat respon
        });
      }
    });

    // --- EKSTRAKSI JSON-LD SCHEMA ---
    const schemas = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonContent = JSON.parse($(el).html());
        
        const processSchema = (schemaObj) => {
          schemas.push({
            type: schemaObj['@type'] || 'Unknown',
            isValid: !!schemaObj['@type'], 
            rawJson: schemaObj
          });
        };

        // JSON-LD kadang berupa array, kadang object tunggal
        if (Array.isArray(jsonContent)) {
          jsonContent.forEach(processSchema);
        } else {
          processSchema(jsonContent);
        }
      } catch (err) {
        console.error('Ada schema yang gagal di-parse');
      }
    });

    // --- MENYUSUN RESPON AKHIR ---
    const auditResult = {
      targetUrl,
      scrapedAt: new Date().toISOString(),
      meta,
      links,
      schemas
    };

    // Mengirim data ke Vue
    res.json(auditResult);

  } catch (error) {
    res.status(500).json({ error: 'Gagal melakukan scraping pada URL tersebut', details: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server Proxy SEO berjalan di http://localhost:${PORT}`);
});