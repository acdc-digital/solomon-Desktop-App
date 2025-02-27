// graph.worker.ts
// This file should be located where your build setup can bundle it appropriately
// Define the messages that can be received
// graph.worker.ts
console.log("Worker loaded");

self.onmessage = (event: MessageEvent) => {
  console.log("Worker received message:", event.data);
  const { type, data } = event.data;

  if (type === 'CALCULATE_SIMILARITIES' && data.embeddings && data.topK) {
    calculateSimilarities(data.embeddings, data.topK);
  } else if (type === 'BUILD_GRAPH' && data.embeddings) {
    buildGraph(data.embeddings);
  }
};

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return (normA && normB) ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

function calculateSimilarities(embeddings: any[], topK: number) {
  const similarities: { source: string, target: string, similarity: number }[] = [];
  for (let i = 0; i < embeddings.length; i++) {
    const chunkA = embeddings[i];
    const similarityBatch = [];
    for (let j = 0; j < embeddings.length; j++) {
      if (i === j) continue;
      const chunkB = embeddings[j];
      const sim = cosineSimilarity(chunkA.embedding, chunkB.embedding);
      if (sim > 0) {
        similarityBatch.push({ id: chunkB.id, similarity: sim });
      }
    }
    const topSimilar = similarityBatch.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
    topSimilar.forEach(sim => {
      similarities.push({
        source: chunkA.id,
        target: sim.id,
        similarity: sim.similarity
      });
    });
  }
  console.log("Worker posting SIMILARITIES_CALCULATED", similarities);
  self.postMessage({ type: 'SIMILARITIES_CALCULATED', data: similarities });
}

function buildGraph(embeddings: any[]) {
  const nodes = embeddings.map(chunk => ({
    id: chunk.id,
    label: (chunk.metadata?.keywords && chunk.metadata.keywords[0]) || chunk.id.slice(0, 8),
    group: (chunk.metadata?.topics && chunk.metadata.topics[0]) || 'default'
  }));
  console.log("Worker posting NODES_BUILT", nodes);
  self.postMessage({ type: 'NODES_BUILT', data: { nodes } });
}