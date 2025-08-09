// Performance Benchmark Configuration
// Roma: Performance validation requirements for all modules

module.exports = {
  // MCP Protocol Performance Targets
  mcp: {
    tool_response_time_ms: 200,
    concurrent_requests: 10,
    max_response_time_95th_percentile: 300,
    memory_usage_mb: 128
  },

  // Vector Database Performance Targets  
  database: {
    search_response_time_ms: 200,
    batch_insert_time_ms: 10000, // 10s for 100 docs
    concurrent_queries: 5,
    connection_retry_attempts: 3,
    max_memory_usage_mb: 256
  },

  // Search Engine Performance Targets
  search: {
    query_response_time_ms: 200,
    cache_hit_response_time_ms: 50,
    concurrent_searches: 10,
    index_refresh_time_ms: 5000,
    relevance_threshold: 0.7
  },

  // Document Processing Performance Targets
  processing: {
    large_document_processing_ms: 60000, // 60s max
    chunk_processing_rate_per_sec: 10,
    metadata_extraction_time_ms: 1000,
    batch_processing_rate_docs_per_min: 20
  },

  // Integration Flow Performance Targets
  integration: {
    end_to_end_pipeline_ms: 5000,
    document_to_search_time_ms: 2000,
    error_recovery_time_ms: 1000,
    health_check_response_ms: 100
  },

  // Resource Usage Limits
  resources: {
    max_heap_memory_mb: 512,
    max_cpu_usage_percent: 80,
    max_open_connections: 50,
    max_file_handles: 1000
  },

  // Quality Gates (Roma enforcement)
  quality: {
    min_test_coverage_percent: 80,
    max_integration_failure_rate_percent: 5,
    max_rework_cycles: 1,
    contract_test_pass_rate_percent: 100
  }
};