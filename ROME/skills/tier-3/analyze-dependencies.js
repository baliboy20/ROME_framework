/**
 * /analyze-dependencies skill (Tier 3)
 *
 * Analyzes cross-requirement dependencies and suggests implementation order.
 *
 * Analysis:
 * 1. Explicit Dependencies - From Preconditions and Conditions
 * 2. Implicit Dependencies - From shared entities
 * 3. Circular Dependencies - Detect cycles in dependency graph
 * 4. Orphan Requirements - Requirements with no dependencies
 * 5. Critical Path - Requirements on critical implementation path
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class AnalyzeDependencies {
  static async execute(params, executionId) {
    const {
      requirements_directory,
      output_file = null,
      detect_circular = true,
      suggest_order = true
    } = params;

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🔗 ANALYZING REQUIREMENT DEPENDENCIES');
      console.log('='.repeat(70));
      console.log('');

      // Load all requirements
      console.log('Loading requirements...\n');
      const requirements = this.loadRequirements(requirements_directory);
      console.log(`Loaded ${requirements.length} requirements\n`);

      // Build dependency graph
      console.log('✓ Check 1/5: Extracting Explicit Dependencies');
      const explicitDeps = this.extractExplicitDependencies(requirements);

      console.log('✓ Check 2/5: Inferring Implicit Dependencies');
      const implicitDeps = this.inferImplicitDependencies(requirements);

      // Merge dependencies
      const allDeps = this.mergeDependencies(explicitDeps, implicitDeps);

      // Build graph
      const graph = this.buildDependencyGraph(requirements, allDeps);

      // Check for circular dependencies
      console.log('✓ Check 3/5: Detecting Circular Dependencies');
      const circularDeps = detect_circular ? this.detectCircularDependencies(graph) : [];

      // Find orphan requirements
      console.log('✓ Check 4/5: Finding Orphan Requirements');
      const orphans = this.findOrphanRequirements(graph);

      // Suggest implementation order
      console.log('✓ Check 5/5: Calculating Implementation Order');
      const implementationOrder = suggest_order ? this.topologicalSort(graph) : [];

      // Calculate critical path
      const criticalPath = this.calculateCriticalPath(graph, implementationOrder);

      // Determine status
      let dependencyStatus;
      if (circularDeps.length > 0) {
        dependencyStatus = 'CIRCULAR_DETECTED';
      } else if (allDeps.length > requirements.length * 2) {
        dependencyStatus = 'HAS_ISSUES';
      } else {
        dependencyStatus = 'CLEAN';
      }

      // Generate report
      const report = {
        dependency_status: dependencyStatus,
        total_requirements: requirements.length,
        total_dependencies: allDeps.length,
        circular_dependencies: circularDeps,
        implementation_order: implementationOrder,
        orphan_requirements: orphans,
        critical_path: criticalPath,
        dependency_graph: graph,
        explicit_dependencies: explicitDeps.length,
        implicit_dependencies: implicitDeps.length,
        timestamp: new Date().toISOString()
      };

      // Write report if requested
      if (output_file) {
        fs.writeFileSync(output_file, JSON.stringify(report, null, 2));
      }

      console.log('');
      console.log('='.repeat(70));
      console.log(`Dependency Status: ${dependencyStatus}`);
      console.log('='.repeat(70));
      console.log(`Total Requirements: ${requirements.length}`);
      console.log(`Total Dependencies: ${allDeps.length}`);
      console.log(`  Explicit: ${explicitDeps.length}`);
      console.log(`  Implicit: ${implicitDeps.length}`);
      console.log(`Circular Dependencies: ${circularDeps.length}`);
      console.log(`Orphan Requirements: ${orphans.length}`);
      console.log(`Critical Path Length: ${criticalPath.length}`);
      console.log('');

      if (circularDeps.length > 0) {
        console.log('⚠️  Circular Dependencies Detected:');
        circularDeps.forEach((cycle, idx) => {
          console.log(`  ${idx + 1}. ${cycle.join(' -> ')}`);
        });
        console.log('');
      }

      if (orphans.length > 0) {
        console.log(`📌 Orphan Requirements (${orphans.length}):`);
        console.log(`  ${orphans.join(', ')}`);
        console.log('');
      }

      if (implementationOrder.length > 0) {
        console.log(`📋 Suggested Implementation Order (first 10):`);
        implementationOrder.slice(0, 10).forEach((req, idx) => {
          console.log(`  ${idx + 1}. ${req}`);
        });
        if (implementationOrder.length > 10) {
          console.log(`  ... and ${implementationOrder.length - 10} more`);
        }
        console.log('');
      }

      return {
        dependency_status: dependencyStatus,
        total_requirements: requirements.length,
        total_dependencies: allDeps.length,
        circular_dependencies: circularDeps,
        implementation_order: implementationOrder,
        dependency_graph: graph
      };

    } catch (error) {
      throw new Error(`Dependency analysis failed: ${error.message}`);
    }
  }

  /**
   * Load all AORDL requirements
   */
  static loadRequirements(requirementsDir) {
    const files = fs.readdirSync(requirementsDir)
      .filter(f => f.match(/^REQ-\d{3}\.yaml$/))
      .sort();

    return files.map(file => {
      const filePath = path.join(requirementsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const req = yaml.load(content);

      // Handle both nested and flat structure
      const requirement = req.requirement || req;

      return {
        id: requirement.ID || requirement.id,
        actor: requirement.Actor || requirement.actor,
        intent: requirement.Intent || requirement.intent,
        preconditions: requirement.Preconditions || requirement.preconditions || '',
        conditions: requirement.Conditions || requirement.conditions || '',
        entities: requirement.Entities || requirement.entities || []
      };
    });
  }

  /**
   * Extract explicit dependencies from Preconditions and Conditions
   */
  static extractExplicitDependencies(requirements) {
    const dependencies = [];

    requirements.forEach(req => {
      const reqId = req.id;

      // Check Preconditions for requirement references
      let preconditions = req.preconditions || '';
      let conditionsField = req.conditions || '';

      // Convert arrays to strings
      if (Array.isArray(preconditions)) {
        preconditions = preconditions.join(' ');
      }
      if (Array.isArray(conditionsField)) {
        conditionsField = conditionsField.join(' ');
      }

      // Look for REQ-XXX patterns
      const reqPattern = /REQ-\d{3}/g;

      const preconditionMatches = preconditions.match(reqPattern) || [];
      const conditionMatches = conditionsField.match(reqPattern) || [];

      const allMatches = [...new Set([...preconditionMatches, ...conditionMatches])];

      allMatches.forEach(depId => {
        if (depId !== reqId) {
          dependencies.push({
            from: reqId,
            to: depId,
            type: 'explicit',
            source: 'preconditions/conditions'
          });
        }
      });
    });

    return dependencies;
  }

  /**
   * Infer implicit dependencies from shared entities
   */
  static inferImplicitDependencies(requirements) {
    const dependencies = [];

    // Build entity-to-requirements map
    const entityMap = new Map();

    requirements.forEach(req => {
      const entities = req.entities || [];
      entities.forEach(entity => {
        if (!entityMap.has(entity)) {
          entityMap.set(entity, []);
        }
        entityMap.get(entity).push(req.id);
      });
    });

    // For entities used by multiple requirements, create dependencies
    // based on requirement complexity (simpler requirements should come first)
    entityMap.forEach((reqIds, entity) => {
      if (reqIds.length > 1) {
        // Sort by ID (assuming earlier IDs are foundational)
        reqIds.sort();

        // Create dependencies from later reqs to earlier reqs
        for (let i = 1; i < reqIds.length; i++) {
          dependencies.push({
            from: reqIds[i],
            to: reqIds[0],
            type: 'implicit',
            source: `shared entity: ${entity}`
          });
        }
      }
    });

    return dependencies;
  }

  /**
   * Merge explicit and implicit dependencies (explicit takes precedence)
   */
  static mergeDependencies(explicitDeps, implicitDeps) {
    const merged = [...explicitDeps];
    const existingPairs = new Set(explicitDeps.map(d => `${d.from}->${d.to}`));

    implicitDeps.forEach(dep => {
      const pair = `${dep.from}->${dep.to}`;
      if (!existingPairs.has(pair)) {
        merged.push(dep);
        existingPairs.add(pair);
      }
    });

    return merged;
  }

  /**
   * Build dependency graph
   */
  static buildDependencyGraph(requirements, dependencies) {
    const graph = {};

    // Initialize nodes
    requirements.forEach(req => {
      graph[req.id] = {
        dependencies: [],
        dependents: [],
        metadata: {
          actor: req.actor,
          intent: req.intent,
          entities: req.entities || []
        }
      };
    });

    // Add edges
    dependencies.forEach(dep => {
      if (graph[dep.from] && graph[dep.to]) {
        graph[dep.from].dependencies.push({
          requirement: dep.to,
          type: dep.type,
          source: dep.source
        });
        graph[dep.to].dependents.push({
          requirement: dep.from,
          type: dep.type
        });
      }
    });

    return graph;
  }

  /**
   * Detect circular dependencies using DFS
   */
  static detectCircularDependencies(graph) {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (node, path = []) => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const deps = graph[node]?.dependencies || [];
      for (const dep of deps) {
        const nextNode = dep.requirement;

        if (!visited.has(nextNode)) {
          dfs(nextNode, [...path]);
        } else if (recursionStack.has(nextNode)) {
          // Found a cycle
          const cycleStart = path.indexOf(nextNode);
          const cycle = [...path.slice(cycleStart), nextNode];
          cycles.push(cycle);
        }
      }

      recursionStack.delete(node);
    };

    Object.keys(graph).forEach(node => {
      if (!visited.has(node)) {
        dfs(node);
      }
    });

    return cycles;
  }

  /**
   * Find orphan requirements (no dependencies and no dependents)
   */
  static findOrphanRequirements(graph) {
    const orphans = [];

    Object.keys(graph).forEach(reqId => {
      const node = graph[reqId];
      if (node.dependencies.length === 0 && node.dependents.length === 0) {
        orphans.push(reqId);
      }
    });

    return orphans;
  }

  /**
   * Topological sort for implementation order (Kahn's algorithm)
   */
  static topologicalSort(graph) {
    const order = [];
    const inDegree = {};

    // Calculate in-degrees
    Object.keys(graph).forEach(node => {
      inDegree[node] = graph[node].dependencies.length;
    });

    // Find nodes with no dependencies
    const queue = Object.keys(inDegree).filter(node => inDegree[node] === 0);

    while (queue.length > 0) {
      // Sort queue for deterministic order
      queue.sort();
      const node = queue.shift();
      order.push(node);

      // Reduce in-degree of dependents
      const dependents = graph[node]?.dependents || [];
      dependents.forEach(dep => {
        inDegree[dep.requirement]--;
        if (inDegree[dep.requirement] === 0) {
          queue.push(dep.requirement);
        }
      });
    }

    // If order doesn't include all nodes, there's a cycle
    if (order.length < Object.keys(graph).length) {
      return [];
    }

    return order;
  }

  /**
   * Calculate critical path (longest path from roots to leaves)
   */
  static calculateCriticalPath(graph, implementationOrder) {
    if (implementationOrder.length === 0) return [];

    // Calculate depth for each requirement
    const depths = {};

    implementationOrder.forEach(reqId => {
      const deps = graph[reqId]?.dependencies || [];
      if (deps.length === 0) {
        depths[reqId] = 0;
      } else {
        const maxDepth = Math.max(...deps.map(d => depths[d.requirement] || 0));
        depths[reqId] = maxDepth + 1;
      }
    });

    // Find maximum depth
    const maxDepth = Math.max(...Object.values(depths));

    // Find all requirements at maximum depth
    const criticalPath = Object.keys(depths)
      .filter(reqId => depths[reqId] === maxDepth)
      .sort();

    return criticalPath;
  }
}

module.exports = AnalyzeDependencies;
