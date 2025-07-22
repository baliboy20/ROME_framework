#!/usr/bin/env node

import { buildVectorStore, searchStore } from "./embed.js";

async function testSearch() {
  console.log("Building vector store...");
  const store = await buildVectorStore("../ROME");
  
  console.log(`\nVector store built: ${store.length} chunks`);
  
  // Test searches
  const queries = [
    "PMA responsibilities",
    "robot developer 7-step protocol", 
    "module design principles"
  ];

  for (const query of queries) {
    console.log(`\n=== Search: "${query}" ===`);
    const results = await searchStore(store, query, 3);
    
    results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.file} (Score: ${result.score.toFixed(3)})`);
      console.log(result.text.substring(0, 200) + "...");
    });
  }
}

testSearch().catch(console.error);