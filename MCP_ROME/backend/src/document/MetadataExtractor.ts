/**
 * MetadataExtractor Implementation
 * Extracts metadata from document content and file information
 */

interface FileInfo {
  path: string;
  extension: string;
  size: number;
  lastModified: Date;
}

interface DocumentMetadata {
  tags: string[];
  categories: string[];
  language: string;
  codeType?: 'snippet' | 'template' | 'pattern';
  complexity: 'simple' | 'moderate' | 'complex';
  frameworks: string[];
}

export class MetadataExtractor {
  private readonly languagePatterns = {
    dart: [/\.dart$/, /import\s+['"]package:/, /class\s+\w+\s+extends/, /@override/, /Widget\s+build/],
    javascript: [/\.js$/, /\.ts$/, /import\s+.*from/, /export\s+/, /function\s+/, /const\s+.*=/],
    python: [/\.py$/, /import\s+/, /def\s+/, /class\s+/, /if\s+__name__\s+==\s+['"]__main__['"]/],
    java: [/\.java$/, /public\s+class/, /import\s+java\./, /@Override/, /public\s+static\s+void\s+main/],
    kotlin: [/\.kt$/, /fun\s+/, /class\s+/, /import\s+/, /val\s+/, /var\s+/],
  };

  private readonly frameworkPatterns = {
    flutter: [/package:flutter/, /StatelessWidget/, /StatefulWidget/, /Widget/, /BuildContext/],
    react: [/import.*react/, /useState/, /useEffect/, /React\./, /JSX\.Element/],
    angular: [/@Component/, /@Injectable/, /ngOnInit/, /Angular/, /import.*@angular/],
    vue: [/Vue\./, /<template>/, /<script>/, /import.*vue/, /@vue/],
    spring: [/@SpringBootApplication/, /@RestController/, /@Service/, /import.*springframework/],
    django: [/from django/, /models\.Model/, /HttpResponse/, /django\./, /settings\.py/],
    firebase: [/firebase/, /FirebaseAuth/, /Firestore/, /FirebaseFirestore/, /firebase\.initializeApp/],
    provider: [/package:provider/, /ChangeNotifier/, /Consumer/, /Provider\.of/, /MultiProvider/],
    bloc: [/package:bloc/, /BlocBuilder/, /BlocProvider/, /Cubit/, /BlocEvent/],
    riverpod: [/package:riverpod/, /StateProvider/, /FutureProvider/, /ConsumerWidget/, /ref\.watch/],
    getx: [/package:get/, /GetxController/, /Obx/, /Get\.to/, /GetMaterialApp/],
    rxdart: [/package:rxdart/, /BehaviorSubject/, /PublishSubject/, /Observable/, /StreamBuilder/],
    http: [/package:http/, /http\.get/, /http\.post/, /HttpClient/, /dio/],
    sqflite: [/package:sqflite/, /Database/, /openDatabase/, /sqflite/, /SQLite/],
    shared_preferences: [/package:shared_preferences/, /SharedPreferences/, /prefs\./, /getSharedPreferences/],
  };

  private readonly tagPatterns = {
    authentication: [/auth/, /login/, /signin/, /signup/, /password/, /token/, /jwt/, /oauth/],
    navigation: [/navigation/, /route/, /navigator/, /pushNamed/, /go_router/, /routing/],
    state: [/state/, /provider/, /bloc/, /cubit/, /notifier/, /observable/, /stream/],
    ui: [/widget/, /component/, /view/, /screen/, /page/, /dialog/, /button/, /text/, /container/],
    database: [/database/, /db/, /sql/, /firestore/, /collection/, /document/, /query/, /insert/, /update/],
    api: [/api/, /http/, /request/, /response/, /endpoint/, /service/, /client/, /fetch/],
    animation: [/animation/, /tween/, /controller/, /animated/, /transition/, /motion/],
    testing: [/test/, /spec/, /mock/, /expect/, /assert/, /unit/, /integration/, /widget_test/],
    performance: [/performance/, /optimization/, /cache/, /memory/, /lazy/, /async/, /future/],
    security: [/security/, /encrypt/, /hash/, /secure/, /certificate/, /ssl/, /tls/],
  };

  private readonly complexityIndicators = {
    simple: [
      /^[^{]*{[^{}]*}[^{]*$/, // Single level braces
      /^\s*\/\/.*$/, // Just comments
      /^[^;]*;[^;]*$/, // Simple statements
    ],
    complex: [
      /class.*extends.*with.*implements/, // Multiple inheritance
      /async.*await.*async.*await/, // Multiple async operations
      /try.*catch.*finally/, // Full error handling
      /<.*<.*<.*>.*>.*>/, // Deep generics
      /\bmixin\b/, // Mixins usage
      /\bfactory\b.*\bredirect/, // Factory redirects
      /Stream.*transform.*listen/, // Stream transformations
    ]
  };

  private readonly codeTypePatterns = {
    snippet: [
      /\/\/ Quick/, /\/\/ Simple/, /\/\/ Utility/,
      /function\s+\w+\s*\([^)]*\)\s*{[^{}]*}/, // Single function
      /^\s*[\w\s]+\s*[=:]\s*[^;{}]+;?\s*$/, // Single assignment
    ],
    template: [
      /\{\{.*\}\}/, // Template variables
      /\$\{.*\}/, // String interpolation templates
      /TODO:/, /FIXME:/, /XXX:/, // Placeholder comments
      /template/, /boilerplate/, /scaffold/,
      /class.*Template/, /BaseClass/, /AbstractClass/,
    ],
    pattern: [
      /abstract class/, /interface/, /implements/,
      /factory/, /singleton/, /builder/, /observer/, /strategy/,
      /Repository/, /Service/, /Controller/, /Manager/, /Handler/,
      /Design Pattern/, /Architecture/, /SOLID/, /MVC/, /MVP/, /MVVM/,
    ]
  };

  private detectLanguage(content: string, fileInfo: FileInfo): string {
    // Check file extension first
    for (const [language, patterns] of Object.entries(this.languagePatterns)) {
      if (patterns[0] && patterns[0].test(fileInfo.path)) {
        return language;
      }
    }

    // Check content patterns
    for (const [language, patterns] of Object.entries(this.languagePatterns)) {
      const contentMatches = patterns.slice(1).filter(pattern => pattern.test(content)).length;
      if (contentMatches >= 2) {
        return language;
      }
    }

    return 'unknown';
  }

  private detectFrameworks(content: string): string[] {
    const frameworks: string[] = [];

    for (const [framework, patterns] of Object.entries(this.frameworkPatterns)) {
      const matches = patterns.filter(pattern => pattern.test(content)).length;
      if (matches > 0) {
        frameworks.push(framework);
      }
    }

    return frameworks;
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const [tag, patterns] of Object.entries(this.tagPatterns)) {
      const matches = patterns.filter(pattern => pattern.test(lowerContent)).length;
      if (matches > 0) {
        tags.push(tag);
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private determineCategories(tags: string[], language: string, frameworks: string[]): string[] {
    const categories: string[] = [];

    // Language-based categories
    if (language === 'dart') categories.push('flutter-development');
    if (language === 'javascript' || language === 'typescript') categories.push('web-development');
    if (language === 'java' || language === 'kotlin') categories.push('mobile-development');
    if (language === 'python') categories.push('backend-development');

    // Tag-based categories
    if (tags.includes('ui') || tags.includes('widget')) categories.push('ui');
    if (tags.includes('database') || tags.includes('api')) categories.push('data');
    if (tags.includes('authentication') || tags.includes('security')) categories.push('security');
    if (tags.includes('state') || tags.includes('navigation')) categories.push('architecture');
    if (tags.includes('testing')) categories.push('testing');
    if (tags.includes('animation')) categories.push('animations');
    if (tags.includes('performance')) categories.push('optimization');

    // Framework-based categories
    if (frameworks.includes('provider') || frameworks.includes('bloc') || frameworks.includes('riverpod')) {
      categories.push('state-management');
    }
    if (frameworks.includes('firebase') || frameworks.includes('http')) {
      categories.push('services');
    }

    return [...new Set(categories)];
  }

  private assessComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const lines = content.split('\n').length;
    const chars = content.length;

    // Check for complex patterns first
    for (const pattern of this.complexityIndicators.complex) {
      if (pattern.test(content)) {
        return 'complex';
      }
    }

    // Check for simple patterns
    for (const pattern of this.complexityIndicators.simple) {
      if (pattern.test(content) && lines < 20 && chars < 500) {
        return 'simple';
      }
    }

    // Default to moderate or complex based on size
    if (lines > 100 || chars > 2000) {
      return 'complex';
    } else if (lines > 20 || chars > 500) {
      return 'moderate';
    }

    return 'simple';
  }

  private classifyCodeType(content: string): 'snippet' | 'template' | 'pattern' | undefined {
    // Check for patterns first (most specific)
    for (const pattern of this.codeTypePatterns.pattern) {
      if (pattern.test(content)) {
        return 'pattern';
      }
    }

    // Check for templates
    for (const pattern of this.codeTypePatterns.template) {
      if (pattern.test(content)) {
        return 'template';
      }
    }

    // Check for snippets
    for (const pattern of this.codeTypePatterns.snippet) {
      if (pattern.test(content)) {
        return 'snippet';
      }
    }

    // Default classification based on size and content
    const lines = content.split('\n').length;
    if (lines < 10 && !content.includes('class') && !content.includes('interface')) {
      return 'snippet';
    }

    return undefined;
  }

  extract(content: string, fileInfo: FileInfo): DocumentMetadata {
    const language = this.detectLanguage(content, fileInfo);
    const frameworks = this.detectFrameworks(content);
    const tags = this.extractTags(content);
    const categories = this.determineCategories(tags, language, frameworks);
    const complexity = this.assessComplexity(content);
    const codeType = this.classifyCodeType(content);

    return {
      tags,
      categories,
      language,
      ...(codeType && { codeType }),
      complexity,
      frameworks,
    };
  }
}