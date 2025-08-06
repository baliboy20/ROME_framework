const mongoose = require('mongoose');
const { Project, Task, Blog, File } = require('../models');

/**
 * Seed Script: Sample Data
 * Creates sample projects, tasks, and blogs for development and testing
 */

const sampleProjects = [
  {
    name: 'E-Commerce Platform Redesign',
    description: 'Complete redesign of the company e-commerce platform with modern UI/UX, improved performance, and mobile-first approach. This project aims to increase conversion rates and improve user experience.',
    folders: [
      '/Users/dev/projects/ecommerce-redesign',
      '/Users/dev/projects/ecommerce-redesign/frontend',
      '/Users/dev/projects/ecommerce-redesign/backend'
    ],
    repositories: [
      {
        name: 'ecommerce-frontend',
        url: 'https://github.com/company/ecommerce-frontend.git',
        type: 'git'
      },
      {
        name: 'ecommerce-backend',
        url: 'https://github.com/company/ecommerce-backend.git',
        type: 'git'
      }
    ],
    coreUrls: [
      {
        title: 'Production Site',
        url: 'https://shop.company.com',
        description: 'Current production e-commerce site'
      },
      {
        title: 'Staging Environment',
        url: 'https://staging.shop.company.com',
        description: 'Staging environment for testing'
      },
      {
        title: 'Design Mockups',
        url: 'https://figma.com/ecommerce-redesign',
        description: 'Figma designs and prototypes'
      }
    ],
    stages: [
      {
        name: 'Discovery & Research',
        order: 1,
        description: 'User research, competitive analysis, requirements gathering'
      },
      {
        name: 'Design & Prototyping',
        order: 2,
        description: 'UI/UX design, wireframes, prototypes'
      },
      {
        name: 'Frontend Development',
        order: 3,
        description: 'React components, responsive design, accessibility'
      },
      {
        name: 'Backend Development',
        order: 4,
        description: 'API development, database optimization, security'
      },
      {
        name: 'Testing & QA',
        order: 5,
        description: 'Unit tests, integration tests, user acceptance testing'
      },
      {
        name: 'Deployment & Launch',
        order: 6,
        description: 'Production deployment, monitoring, performance optimization'
      }
    ]
  },
  {
    name: 'Mobile App Development',
    description: 'Development of a cross-platform mobile application for iOS and Android using React Native. The app will provide core business functionality with offline capabilities.',
    folders: [
      '/Users/dev/projects/mobile-app',
      '/Users/dev/projects/mobile-app/src',
      '/Users/dev/projects/mobile-app/assets'
    ],
    repositories: [
      {
        name: 'mobile-app-react-native',
        url: 'https://github.com/company/mobile-app.git',
        type: 'git'
      }
    ],
    coreUrls: [
      {
        title: 'App Store Connect',
        url: 'https://appstoreconnect.apple.com',
        description: 'iOS app management'
      },
      {
        title: 'Google Play Console',
        url: 'https://play.google.com/console',
        description: 'Android app management'
      }
    ],
    stages: [
      {
        name: 'Planning & Architecture',
        order: 1,
        description: 'Technical architecture, technology stack selection'
      },
      {
        name: 'UI/UX Design',
        order: 2,
        description: 'Mobile-first design, user flows, accessibility'
      },
      {
        name: 'Core Development',
        order: 3,
        description: 'React Native development, state management'
      },
      {
        name: 'Testing & Optimization',
        order: 4,
        description: 'Device testing, performance optimization'
      },
      {
        name: 'App Store Deployment',
        order: 5,
        description: 'App store submission, review process'
      }
    ]
  },
  {
    name: 'API Integration Project',
    description: 'Integration with third-party APIs and services to enhance platform capabilities. Includes payment gateways, shipping providers, and analytics services.',
    folders: [
      '/Users/dev/projects/api-integration'
    ],
    repositories: [
      {
        name: 'api-integration-service',
        url: 'https://github.com/company/api-integration.git',
        type: 'git'
      }
    ],
    coreUrls: [
      {
        title: 'Stripe Dashboard',
        url: 'https://dashboard.stripe.com',
        description: 'Payment processing'
      },
      {
        title: 'API Documentation',
        url: 'https://docs.company.com/api',
        description: 'Internal API documentation'
      }
    ],
    stages: [
      {
        name: 'API Research',
        order: 1,
        description: 'Evaluate third-party APIs and services'
      },
      {
        name: 'Integration Development',
        order: 2,
        description: 'Implement API connections and data mapping'
      },
      {
        name: 'Testing & Validation',
        order: 3,
        description: 'End-to-end testing with real API calls'
      }
    ]
  }
];

const createSampleTasks = (projectIds) => [
  // E-Commerce Platform Tasks
  {
    projectId: projectIds[0],
    title: 'Conduct User Research Survey',
    description: 'Design and conduct user research survey to understand customer pain points and preferences for the new e-commerce platform.',
    category: 'Research',
    progress: 75,
    startDate: new Date('2025-08-01'),
    targetDate: new Date('2025-08-30'),
    status: 'in_progress',
    priority: 'high'
  },
  {
    projectId: projectIds[0],
    title: 'Create Wireframes for Product Pages',
    description: 'Design wireframes for product listing and detail pages with focus on mobile-first approach.',
    category: 'Design',
    progress: 100,
    startDate: new Date('2025-08-01'),
    targetDate: new Date('2025-08-15'),
    status: 'completed',
    priority: 'high'
  },
  {
    projectId: projectIds[0],
    title: 'Implement Shopping Cart Component',
    description: 'Develop React component for shopping cart with add/remove items, quantity updates, and price calculations.',
    category: 'Frontend Development',
    progress: 30,
    startDate: new Date('2025-08-01'),
    targetDate: new Date('2025-08-25'),
    status: 'in_progress',
    priority: 'medium'
  },
  {
    projectId: projectIds[0],
    title: 'Set up Payment Gateway Integration',
    description: 'Integrate Stripe payment gateway for secure payment processing with proper error handling.',
    category: 'Backend Development',
    progress: 0,
    startDate: new Date('2025-08-04'),
    targetDate: new Date('2025-08-30'),
    status: 'pending',
    priority: 'high'
  },
  
  // Mobile App Tasks
  {
    projectId: projectIds[1],
    title: 'Set up React Native Development Environment',
    description: 'Configure development environment with React Native CLI, Android Studio, and Xcode.',
    category: 'Development Setup',
    progress: 100,
    startDate: new Date('2025-08-01'),
    targetDate: new Date('2025-08-05'),
    status: 'completed',
    priority: 'high'
  },
  {
    projectId: projectIds[1],
    title: 'Design Mobile App Navigation',
    description: 'Create navigation structure and implement React Navigation for iOS and Android.',
    category: 'Development',
    progress: 60,
    startDate: new Date('2025-08-01'),
    targetDate: new Date('2025-08-15'),
    status: 'in_progress',
    priority: 'high'
  },
  {
    projectId: projectIds[1],
    title: 'Implement Offline Data Storage',
    description: 'Set up AsyncStorage and implement offline data caching for critical app functionality.',
    category: 'Development',
    progress: 25,
    startDate: new Date('2025-08-01'),
    targetDate: new Date('2025-08-30'),
    status: 'in_progress',
    priority: 'medium'
  },
  
  // API Integration Tasks
  {
    projectId: projectIds[2],
    title: 'Research Payment Gateway APIs',
    description: 'Evaluate Stripe, PayPal, and Square APIs for payment processing integration.',
    category: 'Research',
    progress: 90,
    startDate: new Date('2025-08-01'),
    targetDate: new Date('2025-08-10'),
    status: 'in_progress',
    priority: 'high'
  },
  {
    projectId: projectIds[2],
    title: 'Implement Stripe Webhook Handler',
    description: 'Develop webhook endpoint to handle Stripe payment events and update order status.',
    category: 'Backend Development',
    progress: 0,
    startDate: new Date('2025-08-04'),
    targetDate: new Date('2025-08-25'),
    status: 'pending',
    priority: 'high'
  }
];

const createSampleBlogs = (projectIds) => [
  {
    projectId: projectIds[0],
    title: 'E-Commerce Project Kickoff and Initial Planning',
    content: `# Project Kickoff Meeting

## Overview
Today we held our initial kickoff meeting for the E-Commerce Platform Redesign project. The team is excited to begin this comprehensive overhaul of our existing platform.

## Key Decisions Made
- **Technology Stack**: React 18 with TypeScript for frontend, Node.js with Express for backend
- **Database**: PostgreSQL for primary data, Redis for caching
- **Design System**: We'll be creating a custom design system based on our brand guidelines

## Team Structure
- **Project Manager**: Sarah Johnson
- **Lead Developer**: Mike Chen
- **UI/UX Designer**: Lisa Wang  
- **Backend Developer**: John Smith
- **QA Engineer**: Emma Davis

## Next Steps
1. Complete user research survey by August 15th
2. Begin wireframe creation for key pages
3. Set up development environments and repositories
4. Schedule weekly sprint planning meetings

## Challenges Identified
- Legacy system integration
- Data migration strategy
- Maintaining uptime during transition

We're confident in our approach and excited to deliver a modern, user-friendly e-commerce experience.`,
    urls: [
      {
        title: 'Meeting Recording',
        url: 'https://zoom.us/rec/play/kickoff-meeting-recording'
      },
      {
        title: 'Project Charter Document',
        url: 'https://docs.google.com/document/d/project-charter'
      }
    ],
    tags: ['kickoff', 'planning', 'team', 'strategy'],
    publishDate: new Date('2025-08-01'),
    draft: false
  },
  {
    projectId: projectIds[0],
    title: 'User Research Insights and Key Findings',
    content: `# User Research Summary

## Research Methodology
We conducted a comprehensive user research study over the past 3 weeks, including:
- **Survey**: 500+ responses from existing customers
- **User Interviews**: 15 in-depth interviews
- **Analytics Review**: 6 months of user behavior data
- **Competitive Analysis**: Analysis of 10 major competitors

## Key Findings

### Pain Points
1. **Slow Page Load Times**: 67% of users complained about slow loading
2. **Difficult Navigation**: Users struggled to find products efficiently
3. **Mobile Experience**: Poor mobile responsiveness on product pages
4. **Checkout Process**: 42% cart abandonment rate

### User Preferences
- Clean, minimalist design
- One-click purchasing options
- Better product filtering and search
- Improved product images and descriptions

## Design Implications
Based on these findings, we're prioritizing:
- Performance optimization
- Mobile-first design approach
- Simplified navigation structure
- Streamlined checkout process

## Next Phase
Moving into the design phase with these insights as our foundation.`,
    urls: [
      {
        title: 'Full Research Report',
        url: 'https://company.sharepoint.com/research-report'
      }
    ],
    tags: ['research', 'user-experience', 'insights', 'data'],
    publishDate: new Date('2025-08-01'),
    draft: false
  },
  {
    projectId: projectIds[1],
    title: 'Mobile App Architecture Decisions',
    content: `# Mobile App Technical Architecture

## Technology Stack Decision

### Framework: React Native
After evaluating Flutter, React Native, and native development, we chose React Native for:
- **Code Reuse**: Share logic between iOS and Android
- **Team Expertise**: Our team has strong React experience
- **Community Support**: Large ecosystem and active community
- **Performance**: Acceptable performance for our use case

### State Management: Redux Toolkit
- Predictable state updates
- Excellent developer tools
- Time-travel debugging capabilities

### Navigation: React Navigation v6
- Native performance
- Customizable and flexible
- Strong TypeScript support

## Architecture Patterns

### Folder Structure
\`\`\`
src/
  components/     # Reusable UI components
  screens/        # Screen components
  navigation/     # Navigation configuration
  store/          # Redux store and slices
  services/       # API calls and external services
  utils/          # Helper functions
  types/          # TypeScript type definitions
\`\`\`

### Key Principles
- **Separation of Concerns**: Clear boundaries between UI, logic, and data
- **Testability**: Components designed for easy unit testing
- **Reusability**: Modular components and utilities
- **Type Safety**: Full TypeScript implementation

## Development Guidelines
- All components must have prop types
- 80%+ test coverage required
- ESLint and Prettier for code consistency
- Atomic commits with conventional commit messages

Ready to start implementation phase!`,
    urls: [],
    tags: ['architecture', 'react-native', 'mobile', 'technical'],
    publishDate: new Date('2025-08-03'),
    draft: false
  },
  {
    projectId: projectIds[2],
    title: 'API Integration Strategy and Implementation Plan',
    content: `# API Integration Project Plan

## Integration Scope

### Primary Integrations
1. **Payment Processing**
   - Stripe for credit/debit cards
   - PayPal for alternative payments
   - Apple Pay and Google Pay for mobile

2. **Shipping & Logistics**
   - FedEx API for shipping rates and tracking
   - UPS API for backup shipping option
   - USPS for domestic shipping

3. **Analytics & Monitoring**
   - Google Analytics 4 for user behavior
   - Mixpanel for product analytics
   - Sentry for error monitoring

## Technical Approach

### API Client Architecture
- **Axios** for HTTP requests with interceptors
- **Retry Logic** for handling temporary failures
- **Rate Limiting** to respect API quotas
- **Caching** for frequently accessed data

### Error Handling Strategy
- Graceful degradation when APIs are unavailable
- User-friendly error messages
- Automatic fallback to secondary providers
- Comprehensive logging for debugging

### Security Considerations
- API key management with environment variables
- Request signing for sensitive operations
- HTTPS for all API communications
- Input validation and sanitization

## Implementation Timeline
- **Week 1-2**: Stripe payment integration
- **Week 3**: PayPal integration  
- **Week 4**: Shipping API integrations
- **Week 5**: Analytics implementation
- **Week 6**: Testing and optimization

## Success Metrics
- 99.9% payment processing uptime
- <2 second API response times
- Zero security incidents
- Complete error handling coverage

Looking forward to enhancing our platform capabilities!`,
    urls: [
      {
        title: 'Stripe API Documentation',
        url: 'https://stripe.com/docs/api'
      },
      {
        title: 'Integration Checklist',
        url: 'https://company.notion.so/api-integration-checklist'
      }
    ],
    tags: ['api', 'integration', 'payments', 'technical', 'planning'],
    publishDate: new Date('2025-08-01'),
    draft: false
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Project.deleteMany({}),
      Task.deleteMany({}),
      Blog.deleteMany({}),
      File.deleteMany({})
    ]);
    
    // Create sample projects
    console.log('📊 Creating sample projects...');
    const createdProjects = await Project.insertMany(sampleProjects);
    const projectIds = createdProjects.map(p => p._id);
    
    console.log(`✅ Created ${createdProjects.length} projects`);
    
    // Create sample tasks
    console.log('📋 Creating sample tasks...');
    const sampleTasksData = createSampleTasks(projectIds);
    const createdTasks = await Task.insertMany(sampleTasksData);
    
    console.log(`✅ Created ${createdTasks.length} tasks`);
    
    // Create sample blogs
    console.log('📝 Creating sample blogs...');
    const sampleBlogsData = createSampleBlogs(projectIds);
    const createdBlogs = await Blog.insertMany(sampleBlogsData);
    
    console.log(`✅ Created ${createdBlogs.length} blog entries`);
    
    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log(`   Projects: ${createdProjects.length}`);
    console.log(`   Tasks: ${createdTasks.length}`);
    console.log(`   Blogs: ${createdBlogs.length}`);
    
    // Display project details
    console.log('\n📋 Created Projects:');
    createdProjects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.name}`);
      console.log(`      ID: ${project._id}`);
      console.log(`      Stages: ${project.stages.length}`);
      console.log(`      Repositories: ${project.repositories.length}`);
    });
    
    console.log('\n🎉 Database seeding completed successfully!');
    
    return {
      projects: createdProjects,
      tasks: createdTasks,
      blogs: createdBlogs
    };
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

const clearData = async () => {
  try {
    console.log('🧹 Clearing all sample data...');
    
    const results = await Promise.all([
      Project.deleteMany({}),
      Task.deleteMany({}),
      Blog.deleteMany({}),
      File.deleteMany({})
    ]);
    
    console.log('✅ Data cleared successfully:');
    console.log(`   Projects: ${results[0].deletedCount}`);
    console.log(`   Tasks: ${results[1].deletedCount}`);
    console.log(`   Blogs: ${results[2].deletedCount}`);
    console.log(`   Files: ${results[3].deletedCount}`);
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

module.exports = {
  up: seedData,
  down: clearData
};