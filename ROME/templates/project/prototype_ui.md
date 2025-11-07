# Interactive UI Prototype Template
**Created by**: Chaperone
**Project**: [Project Name]
**Date**: YYYY-MM-DD
**Purpose**: Visual representation of application pages and navigation flows

---

## Overview

This prototype demonstrates the user interface structure and navigation for the project based on the augmented technical specification. It serves as:

1. **Validation tool** - Verifies data model fits on pages
2. **Navigation reference** - Shows user flows between screens
3. **Design foundation** - Starting point for Clara (UX Designer)
4. **Development guide** - Reference for Charlie (Frontend Engineer)

---

## Prototype Deliverables

### 1. HTML Pages

#### Homepage / Dashboard
**File**: `index.html`

**Purpose**: Entry point for application

**Shows**:
- User's primary data (from data model)
- Quick actions and navigation
- Status summaries
- Links to main sections

**Data Model Integration**:
- [List entities displayed on this page]
- [Show example data structure]

**Navigation**:
- Link to [page name]
- Link to [page name]
- [etc.]

---

#### [Page Name 2]
**File**: `[page-name].html`

**Purpose**: [What this page does]

**Shows**:
- [List content]
- [Example: Project details]
- [Related tasks/sub-items]

**Data Model Integration**:
- [List entities displayed]
- [Relationship to other pages]

**Navigation**:
- Back to [parent page]
- Link to [related page]
- [etc.]

---

#### [Page Name 3]
[Continue pattern for each page]

---

## Navigation Flow Map

### User Journey 1: [Journey Name]
```
Homepage
    ↓
[Action] → [Page A]
            ↓
         [Action] → [Page B]
                     ↓
                  [Action] → Confirmation
                               ↓
                            Back to Homepage
```

**Steps**:
1. User lands on homepage
2. User takes action: [description]
3. System navigates to: [page]
4. [Continue steps]
5. Flow completes or returns to start

---

### User Journey 2: [Journey Name]
[Continue for each major user journey]

---

## Page Layout Templates

### Standard Page Structure

```
┌─────────────────────────────────────┐
│          [Header/Navigation]        │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │   Main Content Area      │
│ (Menu)   │                          │
│          │  [Data from model]       │
│          │  [Actions/buttons]       │
│          │                          │
└──────────┴──────────────────────────┘
```

---

## Prototype Technology Stack

### Built With:
- **Framework**: HTML5 + Bootstrap 5
- **Styling**: CSS3 (responsive design)
- **Navigation**: Vanilla JavaScript
- **Icons**: Bootstrap Icons
- **Responsive**: Mobile-first design

### Directory Structure:
```
prototype_ui/
├── index.html                    # Home page
├── [page-name].html             # Individual pages
├── css/
│   ├── bootstrap.min.css        # Bootstrap framework
│   ├── bootstrap-icons.css      # Icon library
│   └── custom.css               # Project-specific styles
├── js/
│   ├── bootstrap.bundle.min.js  # Bootstrap JS
│   ├── navigation.js            # Page navigation logic
│   └── data-examples.js         # Sample data from data model
├── assets/
│   └── images/                  # Placeholder images
├── navigation-manifest.json     # Site map
└── README.md                    # Prototype usage guide
```

---

## Data Model Integration

### Entities Displayed on Pages

#### Entity 1: [Name]
- **Display on pages**: [Homepage, Detail page, etc.]
- **Shows fields**: [name, description, status, etc.]
- **Example data**:
  ```json
  {
    "id": "uuid-123",
    "name": "Example Name",
    "description": "Example description",
    "status": "active",
    "created_at": "2025-10-29"
  }
  ```
- **Relationships shown**: [1:M relationship to Entity 2, etc.]

#### Entity 2: [Name]
[Continue for each entity]

---

## Styling & Visual Design

### Color Scheme
- **Primary**: [Color for main actions/headers]
- **Secondary**: [Color for secondary elements]
- **Success**: [Color for positive states]
- **Error**: [Color for error states]
- **Neutral**: [Color for backgrounds/borders]

### Typography
- **Headings**: [Bootstrap heading styles]
- **Body text**: [Bootstrap base styles]
- **Buttons**: [Button styles with hover states]

### States Shown
- **Loading**: Spinner/skeleton placeholders
- **Empty**: Empty state message
- **Error**: Error message with retry option
- **Success**: Success confirmation message

---

## Navigation Features

### Main Navigation
- **Navbar**: Sticky header with links to main sections
- **Sidebar**: Collapsible menu (if needed)
- **Breadcrumbs**: Shows current location in hierarchy

### Within-Page Navigation
- **Links**: Styled <a> tags showing click-through areas
- **Buttons**: Primary, secondary, danger actions
- **Modals**: Pop-up dialogs (if needed)

### Mobile Navigation
- **Responsive menu**: Hamburger menu on mobile
- **Touch-friendly**: Large click targets (48px minimum)
- **Viewport optimization**: Readable on small screens

---

## Validation Checklist

As prototype was created, verify:

**Data Model Validation**:
- [ ] All entities are represented on appropriate pages
- [ ] Relationships are visually clear
- [ ] Data volume is realistic (e.g., not showing 10,000 items at once)
- [ ] Entity attributes are displayed meaningfully

**Navigation Validation**:
- [ ] All main user journeys can be completed
- [ ] User can always navigate back to previous page
- [ ] No dead ends or missing links
- [ ] Clear visual indication of current page

**UI/UX Validation**:
- [ ] Information architecture is logical
- [ ] Similar actions are consistently placed
- [ ] CTA (Call-to-Action) buttons are prominent
- [ ] Forms are clear and intuitive
- [ ] Error states have helpful messages

**Responsive Validation**:
- [ ] Desktop view (1920px) is functional
- [ ] Tablet view (768px) is functional
- [ ] Mobile view (375px) is functional
- [ ] No horizontal scrolling on mobile

---

## Browser Compatibility

**Tested on:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome mobile)

---

## How to Use This Prototype

### For Patron (You):
1. Open `index.html` in a web browser
2. Click through pages to validate navigation flows
3. Review data model representation
4. Share feedback: Are layouts intuitive? Is data displayed well?

### For Charlie (Frontend Developer):
1. Review page structure and component organization
2. Use as reference for building React/Vue/Flutter components
3. Adapt page layouts to selected framework
4. Implement actual data fetching instead of mock data

### For Clara (UX Designer):
1. Use as foundation for detailed design mockups
2. Refine layouts based on user research
3. Create high-fidelity designs from these wireframes
4. Maintain navigation structure from prototype

---

## Links to Reference Documents

- [Augmented Technical Specification](specification_augmented.md) - Complete technical analysis
- [Data Model](data_model.md) - Entity definitions and relationships
- [Use Cases](use_cases.md) - User workflows and journeys
- [role-sarah.md](../ROME/05-phase2b-audit/role-sarah.md) - Sarah (System Auditor) methodology

---

## Feedback & Iterations

### For Patron Feedback:
- **Question**: What changes would improve this prototype?
- **Feedback**: [Patron provides comments]
- **Action**: Chaperone iterates if needed

### Common Feedback Topics:
- Navigation: "Can I get to [page] from [page]?"
- Data display: "This data doesn't make sense on this page"
- Layout: "Too much information on this page"
- Clarity: "I'm not sure what this section does"

---

## Next Steps

1. **Review prototype** - Patron validates pages and navigation
2. **Provide feedback** - Identify changes needed
3. **Iterate** (if needed) - Chaperone refines prototype
4. **Approval** - Confirm page structure is correct
5. **Handoff**:
   - **To Charlie**: Use for frontend development reference
   - **To Clara**: Use as design foundation
   - **To Ashok**: Validate data model works on pages

---

## Metadata

**Prototype Status**: [Draft / Ready for Review / Approved]
**Last Updated**: YYYY-MM-DD
**Created by**: Chaperone
**Review by**: [Patron name]
**Approved by**: [If applicable]

---

## Files Included

| File | Purpose |
|------|---------|
| index.html | Home page |
| [page-name].html | Individual page templates |
| css/custom.css | Project-specific styling |
| js/navigation.js | Page linking logic |
| js/data-examples.js | Sample data from model |
| navigation-manifest.json | Site map (JSON) |
| README.md | Usage instructions |

---

## Success Criteria for Prototype

✅ All pages are functional and clickable
✅ Navigation flows match user journeys
✅ Data model is represented on pages
✅ Layouts are intuitive and scannable
✅ Mobile/responsive design works
✅ No broken links or missing pages
✅ Clear visual hierarchy
✅ Patron has validated structure
✅ Ready for design/development handoff

---

**Prototype Ready for Review**

Open `index.html` to view the interactive prototype.

For questions or feedback, refer to the Augmented Specification document.
