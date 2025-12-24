/**
 * /generate-architecture-doc skill (Tier 3)
 * Generates Architecture Decision Records (ADR) documentation
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateArchitectureDoc {
  static async execute(params, executionId) {
    const { design_directory, output_file = null } = params;

    try {
      const adrs = [];

      // ADR 1: Layered Architecture
      adrs.push(this.generateADR(1, 'Use Layered Architecture Pattern',
        'Need clear separation of concerns for maintainability',
        'Implement 5-layer architecture: Controller, Service, Repository, Entity, DTO',
        'Clean separation, testability, clear dependencies',
        'More boilerplate code, learning curve'));

      // ADR 2: JWT Authentication
      adrs.push(this.generateADR(2, 'Use JWT for Authentication',
        'Need stateless authentication for scalability',
        'Implement JWT-based authentication with refresh tokens',
        'Stateless, scalable, works across multiple servers',
        'Cannot revoke tokens easily, payload size'));

      // ADR 3: PostgreSQL Database
      adrs.push(this.generateADR(3, 'Use PostgreSQL as Primary Database',
        'Need ACID compliance and relational data structure',
        'Use PostgreSQL 14+ with connection pooling',
        'ACID compliant, mature, excellent tooling',
        'Vertical scaling limits, more complex than NoSQL'));

      // ADR 4: REST API
      adrs.push(this.generateADR(4, 'Use REST for API Design',
        'Need standardized, widely-understood API pattern',
        'Implement RESTful API following OpenAPI 3.0 specification',
        'Standardized, good tooling, wide adoption',
        'Less flexible than GraphQL for complex queries'));

      // ADR 5: TypeScript
      adrs.push(this.generateADR(5, 'Use TypeScript for Type Safety',
        'Need compile-time type checking to reduce bugs',
        'Use TypeScript 5.x with strict mode enabled',
        'Type safety, better IDE support, reduced runtime errors',
        'Build step required, learning curve'));

      const document = this.formatADRDocument(adrs);

      if (output_file) fs.writeFileSync(output_file, document);

      return {
        adr_count: adrs.length,
        document_content: document
      };
    } catch (error) {
      throw new Error(`Architecture documentation generation failed: ${error.message}`);
    }
  }

  static generateADR(number, title, context, decision, consequences, tradeoffs) {
    return {
      number,
      title,
      date: new Date().toISOString().split('T')[0],
      status: 'Accepted',
      context,
      decision,
      consequences,
      tradeoffs
    };
  }

  static formatADRDocument(adrs) {
    let doc = '# Architecture Decision Records\n\n';
    doc += `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n`;
    doc += '---\n\n';

    adrs.forEach(adr => {
      doc += `## ADR-${String(adr.number).padStart(3, '0')}: ${adr.title}\n\n`;
      doc += `**Date:** ${adr.date}\n`;
      doc += `**Status:** ${adr.status}\n\n`;
      doc += `### Context\n${adr.context}\n\n`;
      doc += `### Decision\n${adr.decision}\n\n`;
      doc += `### Consequences\n**Pros:** ${adr.consequences}\n`;
      doc += `**Cons:** ${adr.tradeoffs}\n\n`;
      doc += '---\n\n';
    });

    return doc;
  }
}

module.exports = GenerateArchitectureDoc;
