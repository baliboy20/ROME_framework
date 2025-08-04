class ApiEndpoints {
  // Authentication
  static const String authGoogleInit = '/api/auth/google/init';
  static const String authGoogleCallback = '/api/auth/google/callback';
  static const String authRefresh = '/api/auth/refresh';
  static const String authLogout = '/api/auth/logout';
  
  // Email Management
  static const String emailsFetch = '/api/emails/fetch';
  static const String emails = '/api/emails';
  static String emailById(String id) => '/api/emails/$id';
  static String emailLinks(String id) => '/api/emails/$id/links';
  
  // Scraping
  static const String scrapingBatch = '/api/scraping/batch';
  static String scrapingBatchStatus(String id) => '/api/scraping/batch/$id';
  
  // Articles
  static const String articles = '/api/articles';
  static String articleById(String id) => '/api/articles/$id';
  static String articleContent(String id) => '/api/articles/$id/content';
  
  // Files
  static const String filesArticles = '/api/files/articles';
  static const String filesExport = '/api/files/export';
}