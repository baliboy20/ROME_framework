/**
 * /generate-class-diagrams skill (Tier 2)
 * Generates UML class diagrams in Mermaid format
 * Version: 1.0.0
 */

const fs = require('fs');

class GenerateClassDiagrams {
  static async execute(params, executionId) {
    const { component_structure_file, output_file = null } = params;

    try {
      const componentData = JSON.parse(fs.readFileSync(component_structure_file, 'utf8'));
      const components = componentData.components || [];

      let mermaid = 'classDiagram\n';

      // Generate classes
      components.filter(c => c.layer === 'entity').forEach(comp => {
        mermaid += `    class ${comp.name} {\n`;
        (comp.properties || []).forEach(prop => {
          mermaid += `        +${prop.type} ${prop.name}\n`;
        });
        (comp.methods || []).forEach(method => {
          mermaid += `        +${method.name}()\n`;
        });
        mermaid += `    }\n\n`;
      });

      // Add relationships
      components.forEach(comp => {
        (comp.dependencies || []).forEach(dep => {
          if (components.find(c => c.name === dep)) {
            mermaid += `    ${comp.name} --> ${dep}\n`;
          }
        });
      });

      if (output_file) {
        fs.writeFileSync(output_file, mermaid);
      }

      return {
        diagrams_generated: components.filter(c => c.layer === 'entity').length,
        diagram_content: mermaid
      };
    } catch (error) {
      throw new Error(`Class diagram generation failed: ${error.message}`);
    }
  }
}

module.exports = GenerateClassDiagrams;
