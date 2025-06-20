#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import puppeteer from 'puppeteer';
import webp from 'webp-converter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fetchPageData(url) {
  try {
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true`;
    const response = await fetch(microlinkUrl);
    const data = await response.json();
    
    let screenshotPath = null;
    let title = url;
    let description = '';
    
    if (data.status === 'success') {
      title = data.data.title || url;
      description = data.data.description || '';
    }

    // Take the screenshot with Puppeteer
    console.log(`Taking screenshot with Puppeteer for ${url}...`);
    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      screenshotPath = path.join(__dirname, 'temp', `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`);
      await fs.ensureDir(path.dirname(screenshotPath));
      await page.screenshot({ path: screenshotPath, fullPage: false });
      
      await browser.close();
    } catch (puppeteerError) {
      console.error(`Failed to take screenshot with Puppeteer for ${url}:`, puppeteerError.message);
    }
    
    return {
      title,
      description,
      screenshot: screenshotPath
    };
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return { title: url, description: '', screenshot: null };
  }
}

async function generateImageHTML(title, url, description, screenshotPath) {
  let imageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent placeholder
  
  if (screenshotPath && await fs.pathExists(screenshotPath)) {
    try {
      const imageBuffer = await fs.readFile(screenshotPath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = screenshotPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      imageSrc = `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.warn(`Failed to read screenshot file ${screenshotPath}:`, error.message);
    }
  }
  
  return `<div style="width: 600px; border: 1px solid #ccc; padding: 20px; font-family: sans-serif;">
  <h1>${title}</h1>
  <small><a href="${url}">${url}</a></small>
  <img src="${imageSrc}" style="width: 100%; max-height: 200px; object-fit: cover; border: 1px solid #ccc;" />
  <p style="font-style: italic; text-align: center;">"${description}"</p>
</div>`;
}

async function convertHTMLToImage(html, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setContent(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Screenshot</title>
</head>
<body>
${html}
</body>
</html>`);
  
  await page.setViewport({ width: 600, height: 400 });
  
  const element = await page.$('div');
  await element.screenshot({ path: outputPath });
  
  // Generate WebP version
  const webpPath = outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  try {
    await webp.cwebp(outputPath, webpPath, '-q 80');
    console.log(`Generated WebP version: ${path.basename(webpPath)}`);
  } catch (webpError) {
    console.warn(`Failed to generate WebP version for ${path.basename(outputPath)}:`, webpError.message);
  }
  
  await browser.close();
  return outputPath;
}

async function generateDocument(filterData, urls, week) {
  const currentDate = new Date().toISOString().split('T')[0];
  const formattedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Read the template
  const templatePath = path.join(__dirname, 'layouts', 'document.dmd');
  let template = await fs.readFile(templatePath, 'utf8');
  
  // Replace template placeholders
  template = template.replace('<title>', 'Stuck in the Filter');
  template = template.replace('<creation_date>', currentDate);
  template = template.replace('<column>', 'done_3');
  template = template.replace('<short_description>', 'These are the notes I couldn\'t process during this week.');
  template = template.replace('<pub_date>', formattedDate);
  template = template.replace('<position>', currentDate.replace(/-/g, ''));
  
  // Generate body content
  let bodyContent = '';
  
  for (let i = 0; i < urls.length; i++) {
    const item = urls[i];
    const imageFilename = `stucked-w${week}-${i + 1}.jpg`;
    
    bodyContent += `## ${item.title}\n`;
    bodyContent += `[${item.url}](${item.url})\n\n`;
    bodyContent += `${item.description}\n\n`;
    bodyContent += `![${item.title} page screenshot](/assets/${imageFilename}#center)\n\n`;
  }
  
  // Replace content sections
  const sections = template.split('---');
  let content = sections[1];
  
  content = content.replace('[summary:string]', '[summary:string]\nThese are the notes I couldn\'t process during this week. I didn\'t created the idea... all the credit goes to the AMG crew (as I explained here https://www.angrymetalguy.com/category/stuck-in-the-filter/).');
  content = content.replace('[pub_date:string]', `[pub_date:string]\n${currentDate}`);
  content = content.replace('[short_description:string]', '[short_description:string]\nA collection of notes and thoughts that didn\'t make it into my main articles this week, inspired by the "Stuck in the Filter" concept from AMG.');
  content = content.replace('[body:md]', `[body:md]\n${bodyContent}`);
  
  return sections[0] + '\n---\n' + content;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.error('Usage: npm run unstuck <filter.json>');
    process.exit(1);
  }
  
  const filterPath = args[0];
  
  if (!await fs.pathExists(filterPath)) {
    console.error(`Filter file not found: ${filterPath}`);
    process.exit(1);
  }
  
  try {
    // Clean up any existing temp directory
    const tempDir = path.join(__dirname, 'temp');
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
    
    // Read filter.json
    const filterData = await fs.readJson(filterPath);
    const { week, stucked } = filterData;
    
    if (!week || !stucked || !Array.isArray(stucked)) {
      console.error('Invalid filter.json format. Expected: { week: number, stucked: array }');
      process.exit(1);
    }
    
    console.log(`Processing ${stucked.length} URLs for week ${week}...`);
    
    // Process each URL
    const processedUrls = [];
    
    for (let i = 0; i < stucked.length; i++) {
      const item = stucked[i];
      console.log(`Processing ${i + 1}/${stucked.length}: ${item.url}`);
      
      // Fetch page data and screenshot
      const pageData = await fetchPageData(item.url);
      const title = item.title || pageData.title;
      const description = item.description || pageData.description;
      const tempScreenshotPath = pageData.screenshot;
      
      // Generate image
      const imageFilename = `stucked-w${week}-${i + 1}.jpg`;
      const imagePath = path.join(__dirname, 'data', 'document', 'assets', imageFilename);
      
      const html = await generateImageHTML(title, item.url, description, tempScreenshotPath || 'placeholder-screenshot.png');
      
      // Convert to image using Puppeteer
      await convertHTMLToImage(html, imagePath);
      
      // Clean up temporary screenshot
      if (tempScreenshotPath) {
        try {
          await fs.remove(tempScreenshotPath);
        } catch (cleanupError) {
          console.warn(`Failed to cleanup temp screenshot ${tempScreenshotPath}:`, cleanupError.message);
        }
      }
      
      processedUrls.push({
        title,
        url: item.url,
        description,
        imagePath: imageFilename
      });
    }
    
    // Generate document
    const documentContent = await generateDocument(filterData, processedUrls, week);
    const documentPath = path.join(__dirname, 'data', 'document', `stuck-in-the-filter-2025-w${week}.dmd`);
    
    await fs.writeFile(documentPath, documentContent);
    
    console.log(`\nGenerated:`);
    console.log(`- Document: ${documentPath}`);
    console.log(`- Images: ${processedUrls.length} files in data/document/assets/`);
    
    // Clean up temp directory
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
    
  } catch (error) {
    console.error('Error processing filter:', error.message);
    
    // Clean up temp directory on error too
    const tempDir = path.join(__dirname, 'temp');
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
    
    process.exit(1);
  }
}

main();
