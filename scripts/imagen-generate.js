#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY || require('../credentials/google/gemini-api.json').apiKey;
const MODEL = 'imagen-4.0-fast-generate-001';

const prompts = [
  {
    name: 'exterior-modern-1',
    prompt: 'Modern accessory dwelling unit (ADU) in a lush Massachusetts backyard, contemporary design with large windows, cedar siding, flat roof with subtle overhang, late afternoon golden hour lighting, professional architectural photography, 4K quality'
  },
  {
    name: 'interior-living-1',
    prompt: 'Interior of a modern 600 sqft ADU, open concept living area with kitchen visible, large windows with natural light, minimalist Scandinavian design, light oak floors, white walls, comfortable modern furniture, professional real estate photography'
  },
  {
    name: 'exterior-family-1', 
    prompt: 'Beautiful modern ADU tiny home in suburban Boston backyard, young family enjoying the outdoor patio, string lights, landscaped garden, warm evening atmosphere, lifestyle photography, welcoming and aspirational'
  },
  {
    name: 'interior-bedroom-1',
    prompt: 'Cozy bedroom inside a modern ADU, queen bed with neutral bedding, large window overlooking garden, built-in storage, warm lighting, minimalist design, professional interior photography'
  },
  {
    name: 'aerial-property-1',
    prompt: 'Aerial view of suburban Massachusetts property with main house and modern ADU in backyard, well-maintained lawn, mature trees, showing perfect integration of accessory dwelling unit, real estate drone photography style'
  }
];

async function generateImage(prompt, name) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: prompt }],
      parameters: { 
        sampleCount: 1,
        aspectRatio: '1:1'
      }
    })
  });

  const buffer = await response.arrayBuffer();
  
  // Check if response is JSON (error) or binary (image)
  const text = new TextDecoder().decode(buffer.slice(0, 100));
  if (text.startsWith('{') || text.startsWith('[')) {
    // It's JSON - likely an error
    const fullText = new TextDecoder().decode(buffer);
    const json = JSON.parse(fullText);
    if (json.error) {
      throw new Error(`API error: ${json.error.message}`);
    }
    // Check for predictions format
    if (json.predictions && json.predictions[0]) {
      const imageData = json.predictions[0].bytesBase64Encoded;
      if (imageData) {
        const outputPath = path.join(__dirname, '..', 'data', 'massdwell', 'marketing_assets', 'generated', `${name}.jpg`);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
        console.log(`✅ Generated: ${name}.jpg`);
        return outputPath;
      }
    }
    throw new Error('Unexpected response format');
  } else {
    // Raw binary - save directly
    const outputPath = path.join(__dirname, '..', 'data', 'massdwell', 'marketing_assets', 'generated', `${name}.jpg`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`✅ Generated: ${name}.jpg (raw binary)`);
    return outputPath;
  }
}

async function main() {
  console.log('🎨 Generating MassDwell marketing images with Imagen 4...\n');
  
  const results = [];
  for (const p of prompts) {
    try {
      console.log(`Generating: ${p.name}...`);
      const filePath = await generateImage(p.prompt, p.name);
      results.push({ name: p.name, status: 'success', path: filePath });
    } catch (err) {
      console.error(`❌ Failed: ${p.name} - ${err.message}`);
      results.push({ name: p.name, status: 'failed', error: err.message });
    }
    // Small delay between requests
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n📊 Summary:');
  const success = results.filter(r => r.status === 'success').length;
  console.log(`Generated ${success}/${results.length} images`);
  if (success > 0) {
    console.log(`\nImages saved to: data/massdwell/marketing_assets/generated/`);
  }
}

main();
