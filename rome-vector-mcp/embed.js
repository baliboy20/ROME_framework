import fs from "fs";
import path from "path";
import { glob } from "glob";
import { pipeline } from "@xenova/transformers";

let embedder;

// Initialize local embedding model - vendor-free
async function getEmbedder() {
  if (!embedder) {
    console.error("Loading embedding model (first time may take a few minutes)...");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.error("Embedding model loaded successfully");
  }
  return embedder;
}

function chunkText(text, maxLen = 800) {
  const chunks = [];
  let current = "";
  
  // Split on markdown headers and paragraphs for better semantic chunks
  const sections = text.split(/\n(?=#{1,6}\s)/);
  
  for (const section of sections) {
    const paragraphs = section.split(/\n\s*\n/);
    
    for (const paragraph of paragraphs) {
      if ((current + paragraph).length > maxLen && current.trim()) {
        chunks.push(current.trim());
        current = paragraph + "\n\n";
      } else {
        current += paragraph + "\n\n";
      }
    }
  }
  
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(chunk => chunk.length > 50); // Filter out very short chunks
}

export async function buildVectorStore(dir) {
  const targetPath = path.join(dir, "*.md");
  const romeDir = dir;
  
  // Check if ROME directory exists
  if (!fs.existsSync(romeDir)) {
    throw new Error(`ROME directory not found: ${path.resolve(romeDir)}`);
  }
  
  const files = await glob(targetPath);
  console.log('files', dir);
  
  // Check if any markdown files were found
  if (files.length === 0) {
    throw new Error(`No markdown files found in: ${path.resolve(romeDir)}`);
  }
  
  const store = [];
  const model = await getEmbedder();

  console.error(`Processing ${files.length} markdown files...`);

  for (const file of files) {
    try {
      const text = fs.readFileSync(file, "utf8");
      const chunks = chunkText(text);

      for (const chunk of chunks) {
        const output = await model(chunk, { pooling: "mean", normalize: true });
        store.push({
          file: path.relative(dir, file),
          text: chunk,
          embedding: Array.from(output.data)
        });
      }
      console.error(`✓ Processed ${path.basename(file)}`);
    } catch (error) {
      console.error(`✗ Error processing ${file}: ${error.message}`);
    }
  }

  console.error(`Vector store built: ${store.length} chunks from ${files.length} files`);
  return store;
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((s, a) => s + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((s, b) => s + b * b, 0));
  return dot / (normA * normB);
}

export async function searchStore(store, query, topK = 5) {
  const model = await getEmbedder();
  const queryVec = await model(query, { pooling: "mean", normalize: true });
  const queryEmbedding = Array.from(queryVec.data);

  const scored = store.map(item => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({embedding, ...rest}) => rest); // Remove embedding from results to save space
}