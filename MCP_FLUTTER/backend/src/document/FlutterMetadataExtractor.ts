/**
 * Flutter-Specific Metadata Extractor
 * Extracts rich metadata from Flutter/Dart code and documentation
 * Optimized for coding assistance and pattern matching
 */

export interface FlutterMetadata {
  // Document-level metadata
  title?: string;
  description?: string;
  category: 'architecture' | 'widget' | 'state-management' | 'testing' | 'error-handling' | 
            'navigation' | 'networking' | 'persistence' | 'platform' | 'performance' | 'general';
  documentType: 'guide' | 'api' | 'example' | 'pattern' | 'reference';
  
  // Flutter-specific metadata
  flutterVersion?: string;
  dartVersion?: string;
  dependencies?: string[];
  platforms?: ('ios' | 'android' | 'web' | 'macos' | 'windows' | 'linux')[];
  
  // Code patterns and features
  patterns: {
    widgets?: string[];
    stateManagement?: ('bloc' | 'provider' | 'getx' | 'riverpod' | 'setState')[];
    architecture?: ('clean' | 'mvvm' | 'mvc' | 'feature-first' | 'domain-driven')[];
    testing?: ('unit' | 'widget' | 'integration' | 'golden')[];
    features?: string[];
  };
  
  // Code elements
  codeElements: {
    classes?: string[];
    mixins?: string[];
    extensions?: string[];
    functions?: string[];
    widgets?: string[];
    models?: string[];
    services?: string[];
    repositories?: string[];
  };
  
  // Best practices and anti-patterns
  bestPractices?: string[];
  antiPatterns?: string[];
  performanceConsiderations?: string[];
  
  // Searchable tags
  tags: string[];
  keywords: string[];
  
  // Relationships
  relatedTopics?: string[];
  prerequisites?: string[];
  seeAlso?: string[];
  
  // Quality indicators
  complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  completeness: number; // 0-100
  lastUpdated?: Date;
}

export class FlutterMetadataExtractor {
  private readonly FLUTTER_WIDGETS = new Set([
    'StatelessWidget', 'StatefulWidget', 'InheritedWidget', 'RenderObjectWidget',
    'Container', 'Row', 'Column', 'Stack', 'Scaffold', 'AppBar', 'ListView',
    'GridView', 'CustomScrollView', 'SingleChildScrollView', 'PageView',
    'TextField', 'TextFormField', 'ElevatedButton', 'TextButton', 'IconButton',
    'Card', 'Dialog', 'BottomSheet', 'Drawer', 'NavigationBar', 'TabBar'
  ]);

  private readonly STATE_PATTERNS = {
    bloc: /(?:Bloc|Cubit|BlocProvider|BlocBuilder|BlocListener|BlocConsumer)/,
    provider: /(?:Provider|ChangeNotifier|Consumer|Selector|MultiProvider)/,
    getx: /(?:GetX|GetBuilder|Obx|Controller|GetxController)/,
    riverpod: /(?:ConsumerWidget|ConsumerStatefulWidget|ref\.watch|ref\.read)/,
    setState: /setState\s*\(/
  };

  private readonly ARCHITECTURE_PATTERNS = {
    clean: /(?:UseCase|Repository|DataSource|Entity|Domain|Presentation)/,
    mvvm: /(?:ViewModel|View|Model|Binding|Observer)/,
    mvc: /(?:Controller|Model|View|MVC)/,
    'feature-first': /features\/\w+\/(?:data|domain|presentation)/,
    'domain-driven': /(?:ValueObject|DomainEvent|AggregateRoot|DomainService)/
  };

  extractMetadata(content: string, filePath?: string): FlutterMetadata {
    const metadata: FlutterMetadata = {
      category: this.detectCategory(content, filePath),
      documentType: this.detectDocumentType(content),
      patterns: this.extractPatterns(content),
      codeElements: this.extractCodeElements(content),
      tags: [],
      keywords: [],
      complexity: this.assessComplexity(content),
      completeness: this.assessCompleteness(content)
    };

    // Extract title and description
    const titleDesc = this.extractTitleAndDescription(content);
    if (titleDesc.title) metadata.title = titleDesc.title;
    if (titleDesc.description) metadata.description = titleDesc.description;

    // Extract version information
    const versions = this.extractVersionInfo(content);
    if (versions.flutter) metadata.flutterVersion = versions.flutter;
    if (versions.dart) metadata.dartVersion = versions.dart;

    // Extract dependencies
    metadata.dependencies = this.extractDependencies(content);
    
    // Extract platforms
    metadata.platforms = this.extractPlatforms(content);

    // Extract best practices and anti-patterns
    metadata.bestPractices = this.extractBestPractices(content);
    metadata.antiPatterns = this.extractAntiPatterns(content);
    metadata.performanceConsiderations = this.extractPerformanceConsiderations(content);

    // Generate tags and keywords
    metadata.tags = this.generateTags(metadata);
    metadata.keywords = this.extractKeywords(content);

    // Extract relationships
    const relationships = this.extractRelationships(content);
    if (relationships.related.length > 0) metadata.relatedTopics = relationships.related;
    if (relationships.prerequisites.length > 0) metadata.prerequisites = relationships.prerequisites;
    if (relationships.seeAlso.length > 0) metadata.seeAlso = relationships.seeAlso;

    return metadata;
  }

  private detectCategory(content: string, filePath?: string): FlutterMetadata['category'] {
    const lowerContent = content.toLowerCase();
    const lowerPath = filePath?.toLowerCase() || '';

    if (lowerPath.includes('widget') || lowerContent.includes('widget')) return 'widget';
    if (lowerPath.includes('state') || this.hasStateManagement(content)) return 'state-management';
    if (lowerPath.includes('test') || lowerContent.includes('test')) return 'testing';
    if (lowerPath.includes('error') || lowerPath.includes('exception')) return 'error-handling';
    if (lowerPath.includes('nav') || lowerContent.includes('navigator')) return 'navigation';
    if (lowerPath.includes('network') || lowerContent.includes('http')) return 'networking';
    if (lowerPath.includes('storage') || lowerContent.includes('database')) return 'persistence';
    if (lowerPath.includes('platform') || lowerContent.includes('platform')) return 'platform';
    if (lowerPath.includes('performance') || lowerContent.includes('performance')) return 'performance';
    if (lowerPath.includes('architecture')) return 'architecture';
    
    return 'general';
  }

  private detectDocumentType(content: string): FlutterMetadata['documentType'] {
    if (content.includes('## Example') || content.includes('```dart')) return 'example';
    if (content.includes('## API') || content.includes('### Methods')) return 'api';
    if (content.includes('## Pattern') || content.includes('Best Practice')) return 'pattern';
    if (content.includes('## Guide') || content.includes('## Overview')) return 'guide';
    return 'reference';
  }

  private extractPatterns(content: string): FlutterMetadata['patterns'] {
    const patterns: FlutterMetadata['patterns'] = {};

    // Extract widgets
    const widgets = Array.from(this.FLUTTER_WIDGETS)
      .filter(widget => content.includes(widget));
    if (widgets.length > 0) patterns.widgets = widgets;

    // Extract state management
    const stateManagement: FlutterMetadata['patterns']['stateManagement'] = [];
    Object.entries(this.STATE_PATTERNS).forEach(([name, pattern]) => {
      if (pattern.test(content)) {
        stateManagement.push(name as any);
      }
    });
    if (stateManagement.length > 0) patterns.stateManagement = stateManagement;

    // Extract architecture patterns
    const architecture: FlutterMetadata['patterns']['architecture'] = [];
    Object.entries(this.ARCHITECTURE_PATTERNS).forEach(([name, pattern]) => {
      if (pattern.test(content)) {
        architecture.push(name as any);
      }
    });
    if (architecture.length > 0) patterns.architecture = architecture;

    // Extract testing patterns
    const testing: FlutterMetadata['patterns']['testing'] = [];
    if (content.includes('test(') || content.includes('testWidgets(')) testing.push('unit');
    if (content.includes('testWidgets(')) testing.push('widget');
    if (content.includes('integration_test')) testing.push('integration');
    if (content.includes('goldenFileComparator')) testing.push('golden');
    if (testing.length > 0) patterns.testing = testing;

    // Extract features
    const features: string[] = [];
    if (content.includes('async') || content.includes('Future')) features.push('async');
    if (content.includes('Stream')) features.push('reactive');
    if (content.includes('Animation')) features.push('animation');
    if (content.includes('CustomPaint')) features.push('custom-painting');
    if (content.includes('Isolate')) features.push('isolates');
    if (features.length > 0) patterns.features = features;

    return patterns;
  }

  private extractCodeElements(content: string): FlutterMetadata['codeElements'] {
    const elements: FlutterMetadata['codeElements'] = {};

    // Extract classes
    const classRegex = /class\s+(\w+)/g;
    const classes = Array.from(content.matchAll(classRegex)).map(m => m[1]);
    if (classes.length > 0) elements.classes = classes;

    // Extract mixins
    const mixinRegex = /mixin\s+(\w+)/g;
    const mixins = Array.from(content.matchAll(mixinRegex)).map(m => m[1]);
    if (mixins.length > 0) elements.mixins = mixins;

    // Extract extensions
    const extensionRegex = /extension\s+(\w+)/g;
    const extensions = Array.from(content.matchAll(extensionRegex)).map(m => m[1]);
    if (extensions.length > 0) elements.extensions = extensions;

    // Extract functions
    const functionRegex = /(?:Future|void|String|int|bool|dynamic)?\s+(\w+)\s*\([^)]*\)\s*(?:async\s*)?{/g;
    const functions = Array.from(content.matchAll(functionRegex))
      .map(m => m[1])
      .filter(f => !['if', 'for', 'while', 'switch'].includes(f));
    if (functions.length > 0) elements.functions = functions;

    // Categorize classes
    elements.widgets = classes.filter(c => 
      content.includes(`class ${c} extends StatelessWidget`) ||
      content.includes(`class ${c} extends StatefulWidget`)
    );
    
    elements.models = classes.filter(c => 
      content.includes(`${c}.fromJson`) || 
      content.includes(`${c}.toJson`)
    );
    
    elements.services = classes.filter(c => c.endsWith('Service') || c.endsWith('Client'));
    elements.repositories = classes.filter(c => c.endsWith('Repository'));

    // Clean up empty arrays
    Object.keys(elements).forEach(key => {
      if (Array.isArray(elements[key as keyof typeof elements]) && 
          (elements[key as keyof typeof elements] as any[]).length === 0) {
        delete elements[key as keyof typeof elements];
      }
    });

    return elements;
  }

  private extractTitleAndDescription(content: string): { title?: string; description?: string } {
    const result: { title?: string; description?: string } = {};
    
    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) result.title = titleMatch[1];
    
    // Extract description from overview or first paragraph
    const overviewMatch = content.match(/##\s+Overview\s*\n+([^#]+)/);
    if (overviewMatch) {
      result.description = overviewMatch[1].trim().split('\n')[0];
    } else {
      // Get first paragraph after title
      const firstParaMatch = content.match(/^#[^#]+\n+([^#\n]+)/);
      if (firstParaMatch) result.description = firstParaMatch[1].trim();
    }
    
    return result;
  }

  private extractVersionInfo(content: string): { flutter?: string; dart?: string } {
    const versions: { flutter?: string; dart?: string } = {};
    
    const flutterMatch = content.match(/Flutter\s+([\d.]+)/);
    if (flutterMatch) versions.flutter = flutterMatch[1];
    
    const dartMatch = content.match(/Dart\s+([\d.]+)/);
    if (dartMatch) versions.dart = dartMatch[1];
    
    return versions;
  }

  private extractDependencies(content: string): string[] {
    const deps: Set<string> = new Set();
    
    // From imports
    const importRegex = /import\s+['"]package:([^/'"]+)/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1] !== 'flutter') deps.add(match[1]);
    }
    
    // From pubspec references
    const pubspecRegex = /^\s*(\w+):\s*[\^~]?[\d.]+/gm;
    while ((match = pubspecRegex.exec(content)) !== null) {
      deps.add(match[1]);
    }
    
    return Array.from(deps);
  }

  private extractPlatforms(content: string): FlutterMetadata['platforms'] {
    const platforms: FlutterMetadata['platforms'] = [];
    const platformKeywords = {
      ios: /(?:iOS|UIKit|Cupertino)/i,
      android: /(?:Android|Material|AndroidManifest)/i,
      web: /(?:Web|HTML|browser|PWA)/i,
      macos: /(?:macOS|Mac OS|darwin)/i,
      windows: /(?:Windows|Win32|UWP)/i,
      linux: /(?:Linux|GTK|X11)/i
    };
    
    Object.entries(platformKeywords).forEach(([platform, regex]) => {
      if (regex.test(content)) {
        platforms.push(platform as any);
      }
    });
    
    return platforms.length > 0 ? platforms : undefined;
  }

  private extractBestPractices(content: string): string[] {
    const practices: string[] = [];
    
    // Look for best practice sections
    const bestPracticeRegex = /(?:Best Practice|Recommended|Should|Good practice):\s*([^\n]+)/gi;
    let match;
    while ((match = bestPracticeRegex.exec(content)) !== null) {
      practices.push(match[1].trim());
    }
    
    // Look for DO/DON'T patterns
    const doRegex = /(?:DO|PREFER|CONSIDER):\s*([^\n]+)/gi;
    while ((match = doRegex.exec(content)) !== null) {
      practices.push(match[1].trim());
    }
    
    return practices;
  }

  private extractAntiPatterns(content: string): string[] {
    const antiPatterns: string[] = [];
    
    // Look for anti-pattern sections
    const antiPatternRegex = /(?:Anti-pattern|Avoid|Don't|Bad practice|DON'T):\s*([^\n]+)/gi;
    let match;
    while ((match = antiPatternRegex.exec(content)) !== null) {
      antiPatterns.push(match[1].trim());
    }
    
    return antiPatterns;
  }

  private extractPerformanceConsiderations(content: string): string[] {
    const considerations: string[] = [];
    
    const perfRegex = /(?:Performance|Optimization|Efficiency):\s*([^\n]+)/gi;
    let match;
    while ((match = perfRegex.exec(content)) !== null) {
      considerations.push(match[1].trim());
    }
    
    // Look for specific performance keywords
    if (content.includes('const constructor')) considerations.push('Use const constructors');
    if (content.includes('keys in lists')) considerations.push('Use keys in lists for performance');
    if (content.includes('lazy loading')) considerations.push('Implement lazy loading');
    if (content.includes('dispose')) considerations.push('Properly dispose resources');
    
    return considerations;
  }

  private generateTags(metadata: FlutterMetadata): string[] {
    const tags = new Set<string>();
    
    // Add category
    tags.add(metadata.category);
    
    // Add patterns
    if (metadata.patterns.widgets) metadata.patterns.widgets.forEach(w => tags.add(`widget:${w.toLowerCase()}`));
    if (metadata.patterns.stateManagement) metadata.patterns.stateManagement.forEach(s => tags.add(`state:${s}`));
    if (metadata.patterns.architecture) metadata.patterns.architecture.forEach(a => tags.add(`arch:${a}`));
    if (metadata.patterns.testing) metadata.patterns.testing.forEach(t => tags.add(`test:${t}`));
    
    // Add complexity
    tags.add(`level:${metadata.complexity}`);
    
    // Add document type
    tags.add(`type:${metadata.documentType}`);
    
    return Array.from(tags);
  }

  private extractKeywords(content: string): string[] {
    const keywords = new Set<string>();
    
    // Flutter-specific keywords
    const flutterKeywords = [
      'widget', 'state', 'build', 'context', 'scaffold', 'navigator',
      'route', 'theme', 'material', 'cupertino', 'platform', 'async',
      'stream', 'future', 'provider', 'bloc', 'getx', 'riverpod'
    ];
    
    flutterKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        keywords.add(keyword);
      }
    });
    
    return Array.from(keywords);
  }

  private extractRelationships(content: string): { 
    related: string[]; 
    prerequisites: string[]; 
    seeAlso: string[] 
  } {
    const relationships = {
      related: [] as string[],
      prerequisites: [] as string[],
      seeAlso: [] as string[]
    };
    
    // Extract from markdown sections
    const relatedMatch = content.match(/##\s*Related Topics?\s*\n+([^#]+)/i);
    if (relatedMatch) {
      relationships.related = relatedMatch[1]
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*]\s*/, '').trim());
    }
    
    const prereqMatch = content.match(/##\s*Prerequisites?\s*\n+([^#]+)/i);
    if (prereqMatch) {
      relationships.prerequisites = prereqMatch[1]
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*]\s*/, '').trim());
    }
    
    const seeAlsoMatch = content.match(/##\s*See Also\s*\n+([^#]+)/i);
    if (seeAlsoMatch) {
      relationships.seeAlso = seeAlsoMatch[1]
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*]\s*/, '').trim());
    }
    
    return relationships;
  }

  private hasStateManagement(content: string): boolean {
    return Object.values(this.STATE_PATTERNS).some(pattern => pattern.test(content));
  }

  private assessComplexity(content: string): FlutterMetadata['complexity'] {
    let score = 0;
    
    // Check for advanced patterns
    if (content.includes('CustomPainter')) score += 3;
    if (content.includes('RenderObject')) score += 3;
    if (content.includes('Isolate')) score += 2;
    if (content.includes('Stream')) score += 1;
    if (content.includes('async')) score += 1;
    
    // Check for advanced state management
    if (this.STATE_PATTERNS.bloc.test(content)) score += 2;
    if (this.ARCHITECTURE_PATTERNS.clean.test(content)) score += 2;
    
    // Check for testing
    if (content.includes('golden test')) score += 2;
    if (content.includes('integration_test')) score += 2;
    
    if (score >= 8) return 'expert';
    if (score >= 5) return 'advanced';
    if (score >= 2) return 'intermediate';
    return 'beginner';
  }

  private assessCompleteness(content: string): number {
    let score = 0;
    const maxScore = 10;
    
    // Check for essential sections
    if (content.includes('## Overview') || content.includes('# ')) score += 2;
    if (content.includes('## Example') || content.includes('```dart')) score += 2;
    if (content.includes('## Usage')) score += 1;
    if (content.includes('## API')) score += 1;
    if (content.includes('## Testing')) score += 1;
    if (content.includes('## Best Practice')) score += 1;
    if (content.includes('## Performance')) score += 1;
    if (content.includes('## See Also') || content.includes('## Related')) score += 1;
    
    return Math.round((score / maxScore) * 100);
  }
}