import sharp from 'sharp';

export function initConverter() {
}

export async function convertToWebp(inputPath, outputPath, quality = 80, verbose = false) {
  if (verbose) {
    console.log(`Converting ${inputPath} to ${outputPath} with quality ${quality}...`);
  }
  await sharp(inputPath)
    .webp({ quality })
    .toFile(outputPath);
}

