#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import puppeteer from 'puppeteer';
import webp from 'webp-converter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function takeScreenshotWithTimeout(url) {
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const screenshotPath = path.join(__dirname, 'temp', `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`);
    await fs.ensureDir(path.dirname(screenshotPath));
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    return screenshotPath;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

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
      screenshotPath = await Promise.race([
        takeScreenshotWithTimeout(url),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Screenshot timeout after 45 seconds')), 45000)
        )
      ]);
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
  
  // Read and encode the d.png logo
  let logoSrc = '';
  try {
    const logoPath = path.join(__dirname, 'assets', 'images', 'd.png');
    const logoBuffer = await fs.readFile(logoPath);
    const base64Logo = logoBuffer.toString('base64');
    logoSrc = `data:image/png;base64,${base64Logo}`;
  } catch (error) {
    console.warn('Failed to read d.png logo:', error.message);
  }
  
  return `<div style="
    width: 800px;
    padding: 20px; 
    font-family: sans-serif;
    background: linear-gradient(135deg, #FF6E19 0%, #ffffff 100%);
    position: relative;
    box-sizing: border-box;
  ">
  <h1 style="margin: 0 0 10px 0; color: #333;">${title}</h1>
  <small style="color: #666;"><a href="${url}">${url}</a></small>
  <img src="${imageSrc}" style="width: 100%; max-height: 400px; object-fit: cover; border: 1px solid #FF6E19; margin: 15px 0;" />
  <p style="font-style: italic; text-align: center; margin: 10px 0; color: #444;">"${description}"</p>
  ${logoSrc ? `<div style="position: absolute; bottom: 5px; right: 10px; display: flex; align-items: center; gap: 6px;">
    <img src="${logoSrc}" style="width: 24px; height: 24px;" />
    <span style="color: #333; font-size: 14px; font-weight: 500;">dariomac.com</span>
  </div>` : ''}
</div>`;
}

async function generateLinkedInCarouselPDF(imagePaths, week) {
  const pdfPath = path.join(__dirname, 'data', 'document', 'assets', `stuck-in-the-filter-w${week}-carousel.pdf`);
  
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 1080, height: 1080 });
    
    // Create HTML with all pages for multi-page PDF
    let allPagesHTML = '';
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      
      // Convert image to base64 data URL
      let imageSrc = '';
      try {
        if (await fs.pathExists(imagePath)) {
          const imageBuffer = await fs.readFile(imagePath);
          const base64Image = imageBuffer.toString('base64');
          const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
          imageSrc = `data:${mimeType};base64,${base64Image}`;
        }
      } catch (error) {
        console.warn(`Failed to read image ${imagePath}:`, error.message);
        continue;
      }
      
      allPagesHTML += `
        <div style="
          width: 1080px;
          height: 1080px;
          background-color: #FF6E19;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
          position: relative;
          page-break-after: always;
          box-sizing: border-box;
        ">
          <div style="
            max-width: 90%;
            max-height: 90%;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <img src="${imageSrc}" style="
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              border-radius: 8px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            " alt="Carousel slide ${i + 1}" />
          </div>
          <div style="
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(255,255,255,0.9);
            padding: 8px 12px;
            border-radius: 20px;
            font-weight: bold;
            color: #333;
            font-size: 14px;
          ">${i + 1}/${imagePaths.length}</div>
        </div>
      `;
    }
    
    const completeHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LinkedIn Carousel</title>
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    @page {
      size: 1080px 1080px;
      margin: 0;
    }
  </style>
</head>
<body>
  ${allPagesHTML}
</body>
</html>`;
    
    await page.setContent(completeHTML, { waitUntil: 'networkidle0' });
    
    await page.pdf({
      path: pdfPath,
      width: '1080px',
      height: '1080px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    console.log(`Generated LinkedIn carousel PDF: ${path.basename(pdfPath)}`);
    return pdfPath;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function convertHTMLToImage(html, outputPath) {
  return await Promise.race([
    convertHTMLToImageWithTimeout(html, outputPath),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('HTML to image conversion timeout after 30 seconds')), 30000)
    )
  ]);
}

async function convertHTMLToImageWithTimeout(html, outputPath) {
  let browser;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
    
    await page.setViewport({ width: 800, height: 600 });
    
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
    
    return outputPath;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
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

  const currentYear = new Date().getFullYear();
  
  // Replace template placeholders
  template = template.replace('<title>', `Stuck in the Filter - W${week}`);
  template = template.replace('<creation_date>', currentDate);
  template = template.replace('<column>', 'done_3');
  template = template.replace('<short_description>', `Links I couldn\'t process during the week ${week} of ${currentYear}.`);
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
    bodyContent += `[![${item.title} page screenshot](/assets/${imageFilename}#center)](${item.url})\n<br /><hr />\n`;
  }
  
  // Replace content sections
  const sections = template.split('---');
  let content = sections[1];

  content = content.replace('[summary:string]', `[summary:string]\nLinks I couldn\'t process during the week ${week} of ${currentYear}.`);
  content = content.replace('[pub_date:string]', `[pub_date:string]\n${currentDate}`);
  content = content.replace('[short_description:string]', '[short_description:string]\nThese links for various reasons didn\'t make it into my public content. They come in many different formats and cover a range of topics that I found interesting or useful. Whether they were too niche, incomplete, or simply didn\'t fit the overall flow, these links are still valuable resources for some reason they caught my attention.');
  content = content.replace('[body:md]', `[body:md]\n${bodyContent}`);
  content = content.replace('[acknowledgments:md]', '[acknowledgments:md]\nI didn\'t invented the idea of grabbing everything I couldn\'t process and putting it in a document. I just borrowed it (the idea and the name) from the \'Angry Metal Guy\' website, which has been doing this for years. You can check their [Stuck in the Filter](https://www.angrymetalguy.com/category/stuck-in-the-filter/) series for more details.');
  
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
    
    console.log(`\n\nProcessing ${stucked.length} URLs for week ${week}...`);
    
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
    
    // Generate LinkedIn carousel PDF
    const imagePaths = processedUrls.map(url => 
      path.join(__dirname, 'data', 'document', 'assets', url.imagePath)
    );
    const carouselPDFPath = await generateLinkedInCarouselPDF(imagePaths, week);
    
    console.log(`\nGenerated:`);
    console.log(`- Document: ${documentPath}`);
    console.log(`- Images: ${processedUrls.length} files in data/document/assets/`);
    console.log(`- LinkedIn Carousel PDF: ${carouselPDFPath}`);
    
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
