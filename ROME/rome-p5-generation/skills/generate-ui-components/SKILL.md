# Generate UI Components

**ID**: generate-ui-components
**Category**: Frontend & UI
**Phase**: P5 (Generation)
**Robot**: Charlie

## Purpose

Generate reusable UI component library from design system and screen designs

## Inputs

- ui-design.md (screen mockups, component specifications)
- design-system.md (colors, typography, spacing, component patterns)
- tech-stack.md (UI framework: React, Vue, Flutter, etc.)

## Outputs

- Reusable UI components
- Component props/interfaces
- Component documentation
- Storybook/component gallery entries

## Process

1. Extract reusable patterns from screen designs
2. Generate atomic components (buttons, inputs, cards)
3. Build composite components (forms, lists, modals)
4. Implement design system tokens
5. Add prop validation and TypeScript types
6. Generate component documentation

## Example Output

```typescript
// components/Button/Button.tsx
import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  children
}: ButtonProps) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}
```

```css
/* components/Button/Button.module.css */
.button {
  font-family: var(--font-primary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary {
  background: var(--color-primary);
  color: var(--color-white);
}

.secondary {
  background: var(--color-secondary);
  color: var(--color-text);
}

.small {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.medium {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-base);
}
```

## AORDL Traceability

- UI Design → Component implementation
- Design system tokens → CSS variables
- User interactions → Event handlers
- Accessibility requirements → ARIA attributes
