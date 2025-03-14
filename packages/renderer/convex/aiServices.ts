// /convex/aiServices.ts
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/convex/aiServices.ts

import { OpenAI } from "openai";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate concise labels for document chunks
export const generateNodeLabel = action({
  args: {
    text: v.string(),
    maxWords: v.optional(v.number()),
  },
  handler: async (ctx, { text, maxWords = 10 }): Promise<string> => {
    try {
      const prompt = `Summarize the following text in fewer than ${maxWords} words as a clear, concise label:\n\n"${text}"`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: Math.min(maxWords * 5, 15),
      });
      
      // Check that choices, message, and message.content exist.
      if (
        !response.choices ||
        response.choices.length === 0 ||
        !response.choices[0].message ||
        !response.choices[0].message.content
      ) {
        throw new Error("Invalid response from OpenAI");
      }
      
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error generating label:", error);
      // Return a fallback based on text
      return text.slice(0, 30) + (text.length > 30 ? "..." : "");
    }
  },
});

// Batch process multiple labels
export const batchGenerateLabels = action({
  args: {
    texts: v.array(v.string()),
    maxWords: v.optional(v.number()),
  },
  handler: async (ctx, { texts, maxWords = 10 }): Promise<string[]> => {
    const results: string[] = [];
    
    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < texts.length; i += 5) {
      const batch: string[] = texts.slice(i, i + 5);
      const batchPromises: Promise<string>[] = batch.map(
        (text: string): Promise<string> =>
          ctx.runAction(internal.aiServices.generateNodeLabel, { text, maxWords })
      );
      
      const batchResults: string[] = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  },
});