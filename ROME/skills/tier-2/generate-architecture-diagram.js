/**
 * /generate-architecture-diagram skill (Tier 2)
 * Generates system architecture diagrams in Mermaid format
 * Version: 1.0.0
 */

const fs = require('fs');

class GenerateArchitectureDiagram {
  static async execute(params, executionId) {
    const { component_structure_file, output_file = null, diagram_type = 'layered' } = params;

    try {
      const componentData = JSON.parse(fs.readFileSync(component_structure_file, 'utf8'));
      const components = componentData.components || [];

      let diagramContent = '';

      if (diagram_type === 'layered') {
        diagramContent = this.generateLayeredDiagram(components);
      } else if (diagram_type === 'deployment') {
        diagramContent = this.generateDeploymentDiagram(components);
      } else {
        diagramContent = this.generateDataFlowDiagram(components);
      }

      if (output_file) {
        fs.writeFileSync(output_file, diagramContent);
      }

      const layers = new Set(components.map(c => c.layer)).size;

      return {
        diagram_generated: true,
        diagram_content: diagramContent,
        layers_visualized: layers
      };
    } catch (error) {
      throw new Error(`Architecture diagram generation failed: ${error.message}`);
    }
  }

  static generateLayeredDiagram(components) {
    const layers = {
      controller: [],
      service: [],
      repository: [],
      entity: [],
      dto: []
    };

    components.forEach(comp => {
      if (layers[comp.layer]) {
        layers[comp.layer].push(comp.name);
      }
    });

    let mermaid = 'graph TD\n';
    mermaid += '    subgraph "Presentation Layer"\n';
    layers.controller.forEach(c => mermaid += `        ${c}[${c}]\n`);
    mermaid += '    end\n\n';

    mermaid += '    subgraph "Service Layer"\n';
    layers.service.forEach(c => mermaid += `        ${c}[${c}]\n`);
    mermaid += '    end\n\n';

    mermaid += '    subgraph "Data Access Layer"\n';
    layers.repository.forEach(c => mermaid += `        ${c}[${c}]\n`);
    mermaid += '    end\n\n';

    mermaid += '    subgraph "Domain Layer"\n';
    layers.entity.forEach(c => mermaid += `        ${c}[${c}]\n`);
    mermaid += '    end\n\n';

    // Add connections
    layers.controller.forEach(ctrl => {
      const serviceName = ctrl.replace('Controller', 'Service');
      if (layers.service.includes(serviceName)) {
        mermaid += `    ${ctrl} --> ${serviceName}\n`;
      }
    });

    layers.service.forEach(svc => {
      const repoName = svc.replace('Service', 'Repository');
      if (layers.repository.includes(repoName)) {
        mermaid += `    ${svc} --> ${repoName}\n`;
      }
    });

    return mermaid;
  }

  static generateDeploymentDiagram(components) {
    let mermaid = 'graph LR\n';
    mermaid += '    Client[Client Application]\n';
    mermaid += '    LB[Load Balancer]\n';
    mermaid += '    API[API Server]\n';
    mermaid += '    DB[(Database)]\n';
    mermaid += '    Cache[(Cache)]\n\n';
    mermaid += '    Client --> LB\n';
    mermaid += '    LB --> API\n';
    mermaid += '    API --> DB\n';
    mermaid += '    API --> Cache\n';
    return mermaid;
  }

  static generateDataFlowDiagram(components) {
    let mermaid = 'flowchart TD\n';
    mermaid += '    Request[HTTP Request] --> Controller\n';
    mermaid += '    Controller --> Validation\n';
    mermaid += '    Validation --> Service\n';
    mermaid += '    Service --> Repository\n';
    mermaid += '    Repository --> Database[(Database)]\n';
    mermaid += '    Database --> Repository\n';
    mermaid += '    Repository --> Service\n';
    mermaid += '    Service --> Response[HTTP Response]\n';
    return mermaid;
  }
}

module.exports = GenerateArchitectureDiagram;
