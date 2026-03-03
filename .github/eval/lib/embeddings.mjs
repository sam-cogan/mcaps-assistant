import { pipeline, env } from '@xenova/transformers';

// Use cache default; skip local-only check so model downloads on first run
env.allowLocalModels = false;

let extractor = null;

/** Load the sentence-transformer model (downloads ~23 MB on first run). */
export async function initEmbedder() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
}

/** Return a normalized embedding vector (Float32Array) for the given text. */
export async function embedText(text) {
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/** Cosine similarity between two normalized vectors (dot product). */
export function cosineSimilarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}
