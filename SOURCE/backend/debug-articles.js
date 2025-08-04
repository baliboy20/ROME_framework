#!/usr/bin/env node

// Debug script to test the saved articles functionality
import path from 'path';
import fs from 'fs/promises';

async function debugSavedArticles() {
  console.log('🔍 Debugging Saved Articles Functionality\n');

  const baseDir = './data/scraped-articles';
  
  try {
    // Check if directory exists
    console.log('1. Checking base directory:', baseDir);
    try {
      const stat = await fs.stat(baseDir);
      console.log('✅ Directory exists:', stat.isDirectory());
    } catch (error) {
      console.log('❌ Directory does not exist');
      return;
    }

    // List all markdown files
    console.log('\n2. Scanning for markdown files...');
    const files = await walkDirectory(baseDir);
    const markdownFiles = files.filter(f => f.endsWith('.md'));
    
    console.log(`📄 Found ${markdownFiles.length} markdown files:`);
    
    for (const file of markdownFiles) {
      console.log(`   - ${file}`);
      
      // Read file content and extract metadata
      try {
        const content = await fs.readFile(file, 'utf-8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          const titleMatch = frontmatter.match(/title:\s*"(.+)"/);
          const sourceMatch = frontmatter.match(/source:\s*"(.+)"/);
          
          console.log(`     Title: ${titleMatch ? titleMatch[1] : 'No title'}`);
          console.log(`     Source: ${sourceMatch ? sourceMatch[1] : 'No source'}`);
        }
      } catch (error) {
        console.log(`     Error reading file: ${error.message}`);
      }
    }

    // Test the file system service
    console.log('\n3. Testing FileSystemService directly...');
    
    // Import and test the service
    const { fileSystemService } = await import('./dist/services/FileSystemService.js');
    
    try {
      const savedFiles = await fileSystemService.listSavedFiles();
      console.log(`📋 FileSystemService found ${savedFiles.length} files:`);
      
      savedFiles.forEach(file => {
        console.log(`   - ${file.filename} (${(file.size / 1024).toFixed(2)} KB)`);
        console.log(`     Title: ${file.title}`);
        console.log(`     URL: ${file.url}`);
      });
    } catch (error) {
      console.log(`❌ FileSystemService error: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

async function walkDirectory(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      const subFiles = await walkDirectory(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Run the debug
debugSavedArticles();