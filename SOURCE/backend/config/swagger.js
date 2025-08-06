const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management API',
      version: '1.0.0',
      description: 'A comprehensive Project Management API built with Node.js, Express, and MongoDB',
      contact: {
        name: 'ROME Development Team',
        email: 'team@rome-methodology.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:8090',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Error timestamp'
                },
                path: {
                  type: 'string',
                  description: 'Request path where error occurred'
                },
                method: {
                  type: 'string',
                  description: 'HTTP method used'
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            pages: {
              type: 'integer',
              description: 'Total number of pages'
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page'
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page'
            }
          }
        },
        Project: {
          type: 'object',
          required: ['name', 'description'],
          properties: {
            _id: {
              type: 'string',
              description: 'Project unique identifier',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 200,
              description: 'Project name',
              example: 'My Awesome Project'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 2000,
              description: 'Project description',
              example: 'This is a comprehensive project management system with advanced features.'
            },
            localSourceFolder: {
              type: 'string',
              maxLength: 500,
              description: 'Local source folder path',
              example: '/Users/dev/projects/my-project',
              nullable: true
            },
            githubRepo: {
              type: 'string',
              maxLength: 200,
              description: 'GitHub repository URL',
              example: 'https://github.com/user/repository',
              nullable: true
            },
            folders: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 500
              },
              description: 'Array of folder paths',
              example: ['/src', '/docs', '/tests']
            },
            repositories: {
              type: 'array',
              maxItems: 10,
              items: {
                type: 'object',
                required: ['name', 'url', 'type'],
                properties: {
                  name: {
                    type: 'string',
                    maxLength: 100,
                    description: 'Repository name'
                  },
                  url: {
                    type: 'string',
                    description: 'Repository URL'
                  },
                  type: {
                    type: 'string',
                    enum: ['git', 'svn', 'mercurial', 'other'],
                    default: 'git'
                  }
                }
              },
              description: 'Array of related repositories'
            },
            coreUrls: {
              type: 'array',
              maxItems: 20,
              items: {
                type: 'object',
                required: ['title', 'url'],
                properties: {
                  title: {
                    type: 'string',
                    maxLength: 200,
                    description: 'URL title'
                  },
                  url: {
                    type: 'string',
                    description: 'URL address'
                  },
                  description: {
                    type: 'string',
                    maxLength: 500,
                    description: 'URL description'
                  }
                }
              },
              description: 'Array of core URLs'
            },
            stages: {
              type: 'array',
              maxItems: 50,
              items: {
                type: 'object',
                required: ['name', 'order'],
                properties: {
                  name: {
                    type: 'string',
                    maxLength: 100,
                    description: 'Stage name'
                  },
                  order: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Stage order'
                  },
                  description: {
                    type: 'string',
                    maxLength: 500,
                    description: 'Stage description'
                  }
                }
              },
              description: 'Array of project stages'
            },
            attachments: {
              type: 'array',
              maxItems: 100,
              items: {
                type: 'object',
                required: ['fileId', 'filename', 'originalName', 'mimetype', 'size'],
                properties: {
                  fileId: {
                    type: 'string',
                    description: 'File reference ID'
                  },
                  filename: {
                    type: 'string',
                    description: 'Stored filename'
                  },
                  originalName: {
                    type: 'string',
                    description: 'Original filename'
                  },
                  mimetype: {
                    type: 'string',
                    description: 'File MIME type'
                  },
                  size: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 52428800,
                    description: 'File size in bytes'
                  },
                  uploadDate: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Upload timestamp'
                  },
                  category: {
                    type: 'string',
                    enum: ['document', 'image', 'attachment'],
                    default: 'attachment'
                  }
                }
              },
              description: 'Array of project attachments'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        ProjectInput: {
          type: 'object',
          required: ['name', 'description'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 200,
              description: 'Project name',
              example: 'My Awesome Project'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 2000,
              description: 'Project description',
              example: 'This is a comprehensive project management system with advanced features.'
            },
            localSourceFolder: {
              type: 'string',
              maxLength: 500,
              description: 'Local source folder path',
              example: '/Users/dev/projects/my-project',
              nullable: true
            },
            githubRepo: {
              type: 'string',
              maxLength: 200,
              description: 'GitHub repository URL',
              example: 'https://github.com/user/repository',
              nullable: true
            },
            folders: {
              type: 'array',
              items: {
                type: 'string',
                maxLength: 500
              },
              description: 'Array of folder paths',
              example: ['/src', '/docs', '/tests']
            },
            repositories: {
              type: 'array',
              maxItems: 10,
              items: {
                type: 'object',
                required: ['name', 'url'],
                properties: {
                  name: {
                    type: 'string',
                    maxLength: 100,
                    description: 'Repository name'
                  },
                  url: {
                    type: 'string',
                    description: 'Repository URL'
                  },
                  type: {
                    type: 'string',
                    enum: ['git', 'svn', 'mercurial', 'other'],
                    default: 'git'
                  }
                }
              },
              description: 'Array of related repositories'
            },
            coreUrls: {
              type: 'array',
              maxItems: 20,
              items: {
                type: 'object',
                required: ['title', 'url'],
                properties: {
                  title: {
                    type: 'string',
                    maxLength: 200,
                    description: 'URL title'
                  },
                  url: {
                    type: 'string',
                    description: 'URL address'
                  },
                  description: {
                    type: 'string',
                    maxLength: 500,
                    description: 'URL description'
                  }
                }
              },
              description: 'Array of core URLs'
            },
            stages: {
              type: 'array',
              maxItems: 50,
              items: {
                type: 'object',
                required: ['name', 'order'],
                properties: {
                  name: {
                    type: 'string',
                    maxLength: 100,
                    description: 'Stage name'
                  },
                  order: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Stage order'
                  },
                  description: {
                    type: 'string',
                    maxLength: 500,
                    description: 'Stage description'
                  }
                }
              },
              description: 'Array of project stages'
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request - validation error or malformed request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },
        SortByParam: {
          name: 'sortBy',
          in: 'query',
          description: 'Field to sort by',
          required: false,
          schema: {
            type: 'string',
            default: 'createdAt'
          }
        },
        SortOrderParam: {
          name: 'sortOrder',
          in: 'query',
          description: 'Sort order',
          required: false,
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc'
          }
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search query string',
          required: false,
          schema: {
            type: 'string'
          }
        }
      }
    },
    tags: [
      {
        name: 'Projects',
        description: 'Project management endpoints'
      },
      {
        name: 'Tasks',
        description: 'Task management endpoints'
      },
      {
        name: 'Blogs',
        description: 'Blog/journal management endpoints'
      },
      {
        name: 'Files',
        description: 'File upload and management endpoints'
      },
      {
        name: 'System',
        description: 'System health and information endpoints'
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './server.js'
  ]
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger setup function
const setupSwagger = (app) => {
  // Serve swagger docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .scheme-container { margin: 20px 0 }
    `,
    customSiteTitle: 'Project Management API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true
    }
  }));

  // Serve swagger spec as JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger documentation available at /api/docs');
  return swaggerSpec;
};

module.exports = {
  swaggerSpec,
  setupSwagger
};