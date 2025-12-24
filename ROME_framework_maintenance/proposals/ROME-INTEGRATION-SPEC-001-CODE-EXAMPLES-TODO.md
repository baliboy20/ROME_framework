# ROME-INTEGRATION-SPEC-001: Code Examples Update TODO

**Document:** ROME-INTEGRATION-SPEC-001.md
**Section:** 3.6 Phase 5: Code Generation → AORDL-to-Code Direct Mapping Example
**Current Status:** Illustrative placeholder examples (Python ORM, JavaScript/Express, React)
**Target Status:** Parse-server and Flutter SDK specific examples

---

## Objective

Replace the generic code examples in Section 3.6 with **Parse-server and Flutter SDK** specific implementations that demonstrate AORDL-to-code mapping using the ROME framework's actual technology stack.

---

## Source Material

**Expert Documentation:**
- `/Experts/expert_parse_server/parse-server-expert.md` - Parse-server patterns
- `/Experts/expert_flutter/` - Flutter SDK patterns, including:
  - `01_CORE/frontend_ddd_architecture_expert.md` - DDD architecture
  - `01_CORE/bloc_event_naming_convention_guide.md` - BLoC patterns
  - `03_INTEGRATIONS/parse_flutter_integration_patterns.md` - Parse-Flutter integration
  - `02_PATTERNS/error_handling_patterns_expert.md` - Error handling
  - `04_UI_UX/flutter_ui_component_library.md` - UI components

---

## Examples to Replace

Using **AORDL REQ-002: create invoice** as the reference requirement:

### 1. Database Code (Replace Python ORM example)

**Current:** Generic Python ORM model with SQLAlchemy
**Target:** Parse-server class definition

```javascript
// database/models/Invoice.js (Parse Server)
Parse.Object.extend("Invoice", {
  // From AORDL Invariants, Outcomes, NonFunctional
  // Show Parse-specific validation, Cloud Functions, triggers
  // Reference: /Experts/expert_parse_server/parse-server-expert.md
});
```

**Key Patterns to Include:**
- Parse.Object.extend() class definition
- ACL configuration (from AORDL Preconditions: "Customer authenticated")
- beforeSave/afterSave hooks (from AORDL Invariants: business rules)
- Field validation (from AORDL Invariants)
- Indexes (from AORDL NonFunctional.Performance)

---

### 2. API Code (Replace JavaScript/Express example)

**Current:** Express.js route handler
**Target:** Parse Cloud Function

```javascript
// cloud/functions/createInvoice.js (Parse Cloud Function)
Parse.Cloud.define("createInvoice", async (request) => {
  // From AORDL Preconditions, Intent, Outcomes, Errors
  // Show Parse Cloud Function patterns, ACL checks, business logic
  // Reference: /Experts/expert_parse_server/parse-server-expert.md
});
```

**Key Patterns to Include:**
- Parse.Cloud.define() function signature
- request.user authentication (from AORDL Preconditions)
- Parse.Query for subscription check (from AORDL Preconditions)
- Business logic validation (from AORDL Invariants)
- Error responses (from AORDL Errors)
- Parse.Cloud.sendEmail (from AORDL Outcomes: email confirmation)

---

### 3. UI Code (Replace React example)

**Current:** React functional component
**Target:** Flutter widget with BLoC pattern

```dart
// lib/features/invoice/presentation/screens/invoice_create_screen.dart
class InvoiceCreateScreen extends StatelessWidget {
  // From AORDL Actor, Intent, Outcomes, Errors
  // Show Flutter BLoC pattern, DDD architecture, Parse integration
  // References:
  //   - /Experts/expert_flutter/01_CORE/frontend_ddd_architecture_expert.md
  //   - /Experts/expert_flutter/01_CORE/bloc_event_naming_convention_guide.md
  //   - /Experts/expert_flutter/03_INTEGRATIONS/parse_flutter_integration_patterns.md
}
```

**Key Patterns to Include:**
- Flutter widget structure (Stateless/Stateful)
- BLoC pattern: InvoiceCreateBloc, InvoiceCreateEvent, InvoiceCreateState
- DDD layers: Presentation → Application → Domain → Infrastructure
- Form validation (from AORDL Invariants)
- Error handling (from AORDL Errors)
- Parse Flutter SDK integration (Parse.Cloud.run("createInvoice"))
- UI feedback (from AORDL Outcomes)

---

## Implementation Approach

1. **Review Expert Patterns**
   - Read Parse-server expert documentation
   - Read Flutter DDD architecture patterns
   - Identify canonical code structures

2. **Map AORDL Fields to Parse/Flutter Patterns**
   - Create mapping table: AORDL field → Parse pattern → Flutter pattern
   - Ensure 1:1 traceability maintained

3. **Generate Examples**
   - Use same AORDL REQ-002 (create invoice) for consistency
   - Show complete stack: Parse class + Cloud Function + Flutter screen
   - Include all AORDL field mappings (Invariants, Preconditions, Errors, etc.)

4. **Validate Examples**
   - Ensure examples follow expert patterns exactly
   - Verify Parse-server and Flutter SDK syntax correctness
   - Check that DDD architecture is properly demonstrated

5. **Update ROME-INTEGRATION-SPEC-001.md**
   - Replace Section 3.6 code examples
   - Update revision history (v1.2)
   - Remove placeholder note

---

## Additional Considerations

**P4 Configuration Examples (Section 3.5):**
Also consider updating P4 configuration examples to show:
- Parse-server workspace configuration (parse-server config.json)
- Flutter workspace configuration (pubspec.yaml, directory structure)
- Parse Dashboard configuration

**Skills to Align:**
The following skills in the integration spec should be updated to reflect Parse/Flutter:
- `/generate-database-entity` → Generate Parse.Object.extend() classes
- `/generate-api-endpoint-code` → Generate Parse.Cloud.define() functions
- `/generate-ui-screen-code` → Generate Flutter widgets with BLoC

---

## Timeline

**When to Implement:**
- After Month 1 (skill framework exists)
- Before Month 4 Integration Pilot (need accurate code generation examples)
- Coordinate with Tier 1 skills implementation (PROP-010)

**Estimated Effort:**
- Review expert docs: 2 hours
- Map AORDL → Parse/Flutter patterns: 3 hours
- Generate complete examples: 4 hours
- Validate and update spec: 2 hours
- **Total: ~11 hours**

---

## Success Criteria

✓ Code examples use Parse-server (not generic ORM)
✓ Code examples use Flutter with BLoC pattern (not React)
✓ All AORDL fields map to actual Parse/Flutter patterns
✓ Examples follow expert patterns exactly
✓ Complete feature stack shown (DB + API + UI)
✓ Zero information loss demonstrated
✓ Traceability from AORDL requirement to Parse/Flutter code clear

---

**Status:** TODO - Pending Month 1-2 implementation
**Owner:** TBD (Integration Team)
**Dependencies:** ROME-PROP-010 (Skills), Expert documentation complete
