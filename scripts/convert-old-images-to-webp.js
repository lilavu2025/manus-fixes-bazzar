// Script: convert-old-images-to-webp.js
// Usage: node scripts/convert-old-images-to-webp.js
// Requires: npm install @supabase/supabase-js node-fetch sharp

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const sharp = require('sharp');

// TODO: ضع بيانات supabase الخاصة بك هنا
const SUPABASE_URL = process.env.SUPABASE_URL || "https://gcjqjcuwsofzrgohwleg.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjanFqY3V3c29menJnb2h3bGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTU5NDYsImV4cCI6MjA2Mzc5MTk0Nn0.LXduYXTaCHMEf0RTr-rAcfIrYsp2R7NhgM_voHpc7dw";
const BUCKET = 'product-images';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getAllProducts() {
  const { data, error } = await supabase.from('products').select('id, image, images');
  if (error) throw error;
  return data;
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to download image: ' + url);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadWebP(buffer, fileName) {
  const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, buffer, {
    contentType: 'image/webp',
    upsert: true,
  });
  if (error) throw error;
  return data.path;
}

async function convertAndUpload(url, productId) {
  if (!url || url.endsWith('.webp')) return url;
  try {
    const buffer = await downloadImage(url);
    const webpBuffer = await sharp(buffer).webp({ quality: 90 }).toBuffer();
    const fileName = `${productId}_${Date.now()}.webp`;
    const path = await uploadWebP(webpBuffer, fileName);
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error('Error converting', url, e);
    return url;
  }
}

async function updateProductImages(product) {
  let changed = false;
  let newImage = product.image;
  if (product.image && !product.image.endsWith('.webp')) {
    newImage = await convertAndUpload(product.image, product.id);
    changed = true;
  }
  let newImages = product.images;
  if (Array.isArray(product.images)) {
    newImages = [];
    for (const img of product.images) {
      if (img && !img.endsWith('.webp')) {
        newImages.push(await convertAndUpload(img, product.id));
        changed = true;
      } else {
        newImages.push(img);
      }
    }
  }
  if (changed) {
    await supabase.from('products').update({ image: newImage, images: newImages }).eq('id', product.id);
    console.log('Updated product', product.id);
  }
}

(async () => {
  const products = await getAllProducts();
  for (const product of products) {
    await updateProductImages(product);
  }
  console.log('Done!');
})();
