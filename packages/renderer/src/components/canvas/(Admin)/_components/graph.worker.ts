// graph.worker.js - Simple fix
// This worker focuses on reliability over complexity

// graph.worker.js - Improved version with better visual mapping
// This worker focuses on creating a visually appealing graph

console.log("Graph Worker loaded");

// Simple cache to avoid recalculating similarities
const similarityCache = {};

self.onmessage = (event) => {
  const { type, data } = event.data;
  console.log(`Worker received ${type} message`);

  try {
    if (type === 'CALCULATE_SIMILARITIES' && data && data.embeddings) {
      // Get embeddings and topK
      const embeddings = data.embeddings;
      const topK = data.topK || 5;
      
      console.log(`Processing ${embeddings.length} embeddings for similarities`);
      
      // Calculate links with actual similarity or estimated values
      const links = [];
      
      // Process a reasonable number of embeddings
      const numToProcess = Math.min(embeddings.length, 100);
      
      for (let i = 0; i < numToProcess; i++) {
        const source = embeddings[i];
        
        // Skip invalid embeddings
        if (!source || !source.id) continue;
        
        // Calculate similarities with other embeddings
        const similarities = [];
        
        for (let j = 0; j < embeddings.length; j++) {
          if (i === j) continue; // Skip self
          
          const target = embeddings[j];
          if (!target || !target.id) continue;
          
          const cacheKey = `${source.id}:${target.id}`;
          
          // Get similarity from cache or calculate it
          let similarity;
          if (similarityCache[cacheKey]) {
            similarity = similarityCache[cacheKey];
          } else {
            // Use actual cosine similarity if embeddings exist, otherwise estimate
            if (source.embedding && target.embedding) {
              similarity = calculateCosineSimilarity(source.embedding, target.embedding);
            } else {
              // Estimate with a decent value biased by distance in the array
              // (closer items in the array are likely more related)
              const distance = Math.abs(i - j);
              similarity = Math.max(0.2, 1 - (distance / embeddings.length) * 2);
            }
            
            // Store in cache
            similarityCache[cacheKey] = similarity;
          }
          
          // Only keep meaningful similarities
          if (similarity > 0.2) {
            similarities.push({
              id: target.id,
              similarity: similarity
            });
          }
        }
        
        // Sort and take top K similarities
        similarities.sort((a, b) => b.similarity - a.similarity);
        const topSimilar = similarities.slice(0, topK);
        
        // Create links for top similarities
        topSimilar.forEach(sim => {
          links.push({
            source: source.id,
            target: sim.id,
            similarity: sim.similarity,
            relationship: `Similarity: ${(sim.similarity * 100).toFixed(1)}%`
          });
        });
      }
      
      console.log(`Created ${links.length} links for visualization`);
      self.postMessage({ type: 'SIMILARITIES_CALCULATED', data: links });
    } 
    else if (type === 'BUILD_GRAPH' && data && data.embeddings) {
      const embeddings = data.embeddings;
      console.log(`Processing ${embeddings.length} embeddings for nodes`);
      
      // Create enhanced nodes for better visualization
      const nodes = [];
      
      for (let i = 0; i < embeddings.length; i++) {
        const chunk = embeddings[i];
        if (!chunk || !chunk.id) continue;
        
        // Get metadata with smart fallbacks
        const keywords = chunk.metadata?.keywords || [];
        const topics = chunk.metadata?.topics || [];
        
        // Create a better label 
        let label;
        if (keywords.length > 0) {
          label = keywords.slice(0, 2).join(", ");
        } else if (chunk.pageContent && typeof chunk.pageContent === 'string') {
          // Use the first 15 chars of content if available
          label = chunk.pageContent.substring(0, 15) + "...";
        } else {
          label = `Node ${i+1}`;
        }
        
        // Create a meaningful group
        let group;
        if (topics.length > 0) {
          group = topics[0];
        } else if (keywords.length > 0) {
          // Use first keyword to inform group if no topics
          const kw = keywords[0].toLowerCase();
          if (kw.includes('ai') || kw.includes('machine')) {
            group = 'AI';
          } else if (kw.includes('data') || kw.includes('info')) {
            group = 'Knowledge';
          } else if (kw.includes('tech') || kw.includes('software')) {
            group = 'Technology';
          } else {
            group = 'default';
          }
        } else {
          group = 'default';
        }
        
        // Determine significance based on metadata richness
        const hasMetadata = keywords.length > 0 || topics.length > 0;
        const significance = hasMetadata ? 1 : 0;
        
        // Add the enhanced node
        nodes.push({
          id: chunk.id,
          label: label,
          group: group,
          significance: significance,
          version: chunk.version || 1,
          // Add random initial positions for better layout
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50
        });
      }
      
      console.log(`Created ${nodes.length} enhanced nodes for visualization`);
      self.postMessage({ type: 'NODES_BUILT', data: { nodes } });
    }
  } catch (error) {
    console.error("Worker error:", error);
    self.postMessage({ 
      type: 'ERROR', 
      data: { message: error.message, stack: error.stack } 
    });
  }
};

// Calculate cosine similarity between two embedding vectors
function calculateCosineSimilarity(a, b) {
  try {
    // Safety check
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return 0.3; // Return a reasonable default
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  } catch (error) {
    console.error("Error calculating similarity:", error);
    return 0.3; // Reasonable default on error
  }
}