# Afflyt Pro - Automations Page UX Study (Part 3/5)
## Visual Design & Component Library

**Version**: 1.0  
**Date**: November 27, 2025  
**Focus**: Design system, components, layouts

---

## 📋 Part 3 Contents

1. Design System Foundations
2. Component Library
3. Page Layout Specifications
4. Responsive Design Strategy
5. Dark Theme Implementation

---

## 1. Design System Foundations

### 1.1 Color Palette (Extended)

```css
/* Primary Colors */
--cyan-400: #22D3EE;    /* Highlights, hover states */
--cyan-500: #06B6D4;    /* Primary brand, CTAs */
--cyan-600: #0891B2;    /* Active states, pressed */

--blue-400: #60A5FA;    /* Secondary highlights */
--blue-500: #3B82F6;    /* Gradient end, accents */
--blue-600: #2563EB;    /* Deep blue accents */

/* Gradient (Primary CTA) */
--gradient-primary: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
--gradient-hover: linear-gradient(135deg, #22D3EE 0%, #60A5FA 100%);

/* Background Hierarchy */
--bg-primary: #0A0E1A;      /* Main app background */
--bg-secondary: #111827;    /* Card background */
--bg-tertiary: #1F2937;     /* Elevated elements, dropdowns */
--bg-hover: #374151;        /* Hover states */

/* Glassmorphism */
--glass-bg: rgba(17, 24, 39, 0.6);
--glass-border: rgba(75, 85, 99, 0.3);
--glass-blur: blur(12px);

/* Text Hierarchy */
--text-primary: #F9FAFB;    /* Main headings, high emphasis */
--text-secondary: #D1D5DB;  /* Body text, labels */
--text-tertiary: #9CA3AF;   /* Secondary info, meta */
--text-disabled: #6B7280;   /* Disabled text */

/* Semantic Colors */
--success: #10B981;         /* Active automations, positive metrics */
--success-bg: rgba(16, 185, 129, 0.1);
--success-border: rgba(16, 185, 129, 0.3);

--warning: #F59E0B;         /* Warnings, upgrade prompts */
--warning-bg: rgba(245, 158, 11, 0.1);
--warning-border: rgba(245, 158, 11, 0.3);

--error: #EF4444;           /* Errors, destructive actions */
--error-bg: rgba(239, 68, 68, 0.1);
--error-border: rgba(239, 68, 68, 0.3);

--info: #A855F7;            /* Info, tips, PRO features */
--info-bg: rgba(168, 85, 247, 0.1);
--info-border: rgba(168, 85, 247, 0.3);

/* Performance Badge Colors */
--badge-top: #FFD700;       /* Gold - Top Performer */
--badge-high: #C0C0C0;      /* Silver - High Performance */
--badge-good: #CD7F32;      /* Bronze - Good */
--badge-new: #06B6D4;       /* Cyan - New */

/* Borders & Dividers */
--border-subtle: #1F2937;
--border-default: #374151;
--border-strong: #4B5563;
--border-neon: #06B6D4;     /* Active states, focus */
```

---

### 1.2 Typography Scale

```css
/* Font Families */
--font-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 
             'Helvetica Neue', Arial, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

/* Type Scale */
--text-xs: 12px;      /* Small labels, metadata */
--text-sm: 14px;      /* Body text, descriptions */
--text-base: 16px;    /* Default, inputs */
--text-lg: 18px;      /* Card titles, subtitles */
--text-xl: 20px;      /* Section headers */
--text-2xl: 24px;     /* Page titles */
--text-3xl: 30px;     /* Hero headlines */
--text-4xl: 36px;     /* Display text */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Letter Spacing */
--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.05em;
```

---

### 1.3 Spacing System (8px Grid)

```css
--space-0: 0;
--space-1: 4px;     /* xs - tight padding */
--space-2: 8px;     /* sm - base unit */
--space-3: 12px;    /* md - comfortable padding */
--space-4: 16px;    /* lg - section padding */
--space-5: 20px;    /* xl */
--space-6: 24px;    /* 2xl - card padding */
--space-8: 32px;    /* 3xl - large spacing */
--space-10: 40px;   /* 4xl - section dividers */
--space-12: 48px;   /* 5xl - major sections */
--space-16: 64px;   /* 6xl - hero spacing */
```

---

### 1.4 Border Radius System

```css
--radius-sm: 4px;    /* Small elements, badges */
--radius-md: 8px;    /* Buttons, inputs, small cards */
--radius-lg: 12px;   /* Cards, modals */
--radius-xl: 16px;   /* Large cards, containers */
--radius-2xl: 24px;  /* Hero sections */
--radius-full: 9999px; /* Pills, circular elements */
```

---

### 1.5 Shadow System

```css
/* Elevation Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.4);

/* Glow Effects (for neon accents) */
--glow-cyan: 0 0 20px rgba(6, 182, 212, 0.3);
--glow-blue: 0 0 20px rgba(59, 130, 246, 0.3);
--glow-success: 0 0 15px rgba(16, 185, 129, 0.3);
```

---

## 2. Component Library

### 2.1 Automation Card (Primary Component)

**Default State (Active)**:

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  Hot Deals Elettronica        [●ON] [⋮]                  │ ← Header
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                            │
│  📱 Electronics  💻 Computers                             │ ← Categories
│  📢 Tech Deals Italia                                     │ ← Channel
│                                                            │
│  ┌──────────────┬──────────────┬──────────────┐          │
│  │   Runs: 47   │ Deals: 156   │  CTR: 7.2%  │          │ ← Stats
│  └──────────────┴──────────────┴──────────────┘          │
│                                                            │
│  🥇 Top Performer • Last run: 2 hours ago                │ ← Footer
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**CSS Implementation**:

```css
.automation-card {
  /* Glassmorphism Base */
  background: rgba(17, 24, 39, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(75, 85, 99, 0.3);
  border-radius: 12px;
  padding: 24px;
  
  /* Shadow & Transition */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.automation-card:hover {
  border-color: rgba(6, 182, 212, 0.5);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3),
              0 0 20px rgba(6, 182, 212, 0.2);
  transform: translateY(-2px);
}

/* Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--bg-hover);
  border-radius: 9999px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-switch.active {
  background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.toggle-switch.active::after {
  transform: translateX(20px);
}

/* Categories */
.card-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

/* Stats Grid */
.card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

/* Performance Badge */
.performance-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #FFD700;
}

.performance-badge.top-performer {
  color: #FFD700;
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
}

.performance-badge.high {
  color: #C0C0C0;
  background: rgba(192, 192, 192, 0.1);
  border-color: rgba(192, 192, 192, 0.3);
}

.performance-badge.new {
  color: #06B6D4;
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.3);
}
```

---

### 2.2 Button System

**Primary Button (Gradient)**:

```html
<button class="btn btn-primary">
  <span class="btn-icon">✨</span>
  <span>Create Automation</span>
</button>
```

```css
.btn {
  /* Base */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  /* Focus */
  &:focus-visible {
    outline: 2px solid var(--cyan-400);
    outline-offset: 2px;
  }
}

.btn-primary {
  background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #22D3EE 0%, #60A5FA 100%);
  box-shadow: 0 6px 12px rgba(6, 182, 212, 0.4);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

**Secondary Button (Outline)**:

```css
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border-strong);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
  border-color: var(--cyan-500);
  color: var(--text-primary);
}
```

**Ghost Button (Text Only)**:

```css
.btn-ghost {
  background: transparent;
  color: var(--text-tertiary);
  padding: 8px 16px;
}

.btn-ghost:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}
```

**Icon Button**:

```css
.btn-icon-only {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 8px;
}
```

**Size Variants**:

```css
.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-lg {
  padding: 16px 32px;
  font-size: 18px;
}
```

---

### 2.3 Input Components

**Text Input**:

```html
<div class="input-group">
  <label for="name" class="input-label">Automation Name</label>
  <input 
    type="text" 
    id="name" 
    class="input"
    placeholder="e.g. Hot Deals Elettronica"
  />
  <span class="input-hint">Give it a clear, descriptive name</span>
</div>
```

```css
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 16px;
  transition: all 0.2s;
}

.input::placeholder {
  color: var(--text-disabled);
}

.input:focus {
  outline: none;
  border-color: var(--cyan-500);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
  background: rgba(31, 41, 55, 0.8);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}
```

**Search Input**:

```html
<div class="search-input">
  <svg class="search-icon">...</svg>
  <input type="search" placeholder="Search automations..." />
  <button class="search-clear">✕</button>
</div>
```

```css
.search-input {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input input {
  padding-left: 48px;
  padding-right: 48px;
}

.search-clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: none;
  align-items: center;
  justify-content: center;
  background: var(--bg-hover);
  border: none;
  border-radius: 4px;
  color: var(--text-tertiary);
  cursor: pointer;
}

.search-input input:not(:placeholder-shown) ~ .search-clear {
  display: flex;
}
```

**Slider (Range Input)**:

```html
<div class="slider-group">
  <label>Max Price</label>
  <div class="slider-container">
    <input 
      type="range" 
      class="slider"
      min="10" 
      max="500" 
      value="100" 
    />
    <div class="slider-labels">
      <span>€10</span>
      <span class="slider-value">€100</span>
      <span>€500</span>
    </div>
  </div>
</div>
```

```css
.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.slider-value {
  color: var(--text-primary);
  font-weight: 600;
}
```

---

### 2.4 Dropdown Menu (Card Actions)

```html
<div class="dropdown">
  <button class="dropdown-trigger">⋮</button>
  <div class="dropdown-menu">
    <button class="dropdown-item">
      <span class="item-icon">👁️</span>
      <span>View Details</span>
    </button>
    <button class="dropdown-item">
      <span class="item-icon">⚡</span>
      <span>Quick Edit</span>
    </button>
    <div class="dropdown-divider"></div>
    <button class="dropdown-item danger">
      <span class="item-icon">🗑️</span>
      <span>Delete</span>
    </button>
  </div>
</div>
```

```css
.dropdown {
  position: relative;
}

.dropdown-trigger {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-trigger:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-default);
  color: var(--text-primary);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  min-width: 200px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  padding: 8px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s;
  z-index: 50;
}

.dropdown:hover .dropdown-menu,
.dropdown-menu:hover {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown-item.danger {
  color: var(--error);
}

.dropdown-item.danger:hover {
  background: var(--error-bg);
}

.dropdown-divider {
  height: 1px;
  background: var(--border-subtle);
  margin: 8px 0;
}
```

---

### 2.5 Modal/Dialog

```html
<div class="modal-overlay">
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Delete Automation?</h2>
      <button class="modal-close">✕</button>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to delete "Hot Deals Elettronica"?</p>
      <p>This action cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-danger">Delete</button>
    </div>
  </div>
</div>
```

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.2s;
}

.modal {
  width: 90%;
  max-width: 480px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### 2.6 Toast Notification

```html
<div class="toast toast-success">
  <div class="toast-icon">✅</div>
  <div class="toast-content">
    <div class="toast-title">Automation created!</div>
    <div class="toast-message">Your automation is now active</div>
  </div>
  <button class="toast-close">✕</button>
</div>
```

```css
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  min-width: 320px;
  max-width: 400px;
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  z-index: 200;
  animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-success {
  border-left: 3px solid var(--success);
}

.toast-error {
  border-left: 3px solid var(--error);
}

.toast-warning {
  border-left: 3px solid var(--warning);
}

.toast-icon {
  font-size: 20px;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.toast-message {
  font-size: 14px;
  color: var(--text-secondary);
}

.toast-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 4px;
}

.toast-close:hover {
  background: var(--bg-hover);
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

## 3. Page Layout Specifications

### 3.1 Desktop Layout (1440px+)

```
┌────────────────────────────────────────────────────────────┐
│ [Sidebar Nav]  │  Main Content Area                        │
│                │                                            │
│ Dashboard      │  ┌──────────────────────────────────────┐ │
│ Analytics      │  │ Page Header                          │ │
│ Automations ✓  │  │ Title + Stats + Create Button        │ │
│ Channels       │  └──────────────────────────────────────┘ │
│                │                                            │
│                │  ┌──────────────────────────────────────┐ │
│                │  │ Insights Panel (conditional)         │ │
│                │  └──────────────────────────────────────┘ │
│                │                                            │
│                │  ┌──────────────────────────────────────┐ │
│                │  │ Controls Bar                         │ │
│                │  │ Search + Filters + View Toggle       │ │
│                │  └──────────────────────────────────────┘ │
│                │                                            │
│                │  ┌──────┐ ┌──────┐ ┌──────┐             │
│                │  │ Card │ │ Card │ │ Card │             │
│                │  └──────┘ └──────┘ └──────┘             │
│                │                                            │
│                │  ┌──────┐ ┌──────┐ ┌──────┐             │
│                │  │ Card │ │ Card │ │ Card │             │
│                │  └──────┘ └──────┘ └──────┘             │
│                │                                            │
└────────────────────────────────────────────────────────────┘

Layout specs:
- Sidebar: 240px fixed
- Main content: calc(100% - 240px)
- Content max-width: 1440px
- Grid: 3 columns with 24px gap
- Card: min-width 360px
```

---

### 3.2 Tablet Layout (768px - 1024px)

```
┌────────────────────────────────────┐
│ [☰ Hamburger Menu]  [🔔] [👤]     │
├────────────────────────────────────┤
│ Automations        [+ Create]      │
│                                    │
│ ┌──────────────────────────────┐  │
│ │ Controls (Search + Filters)  │  │
│ └──────────────────────────────┘  │
│                                    │
│ ┌──────────┐ ┌──────────┐        │ ← 2 columns
│ │  Card    │ │  Card    │        │
│ └──────────┘ └──────────┘        │
│                                    │
│ ┌──────────┐ ┌──────────┐        │
│ │  Card    │ │  Card    │        │
│ └──────────┘ └──────────┘        │
│                                    │
└────────────────────────────────────┘

Layout specs:
- Full width (no sidebar)
- Grid: 2 columns with 16px gap
- Card: min-width 320px
```

---

### 3.3 Mobile Layout (<768px)

```
┌──────────────────────┐
│ ☰ Afflyt      🔔 👤 │
├──────────────────────┤
│ Automations          │
│ [+ Create]           │
├──────────────────────┤
│ [🔍] [All▼] [Sort▼] │ ← Compact controls
├──────────────────────┤
│                      │
│ ┌──────────────────┐ │ ← 1 column (stack)
│ │                  │ │
│ │      Card        │ │
│ │                  │ │
│ └──────────────────┘ │
│                      │
│ ┌──────────────────┐ │
│ │                  │ │
│ │      Card        │ │
│ │                  │ │
│ └──────────────────┘ │
│                      │
└──────────────────────┘

Layout specs:
- Full width with 16px padding
- Single column stack
- Cards: 100% width
- Touch-optimized buttons (48px min height)
```

---

## 4. Responsive Design Strategy

### 4.1 Breakpoint System

```css
/* Mobile First Approach */

/* Base styles (320px+) */
.automations-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 16px;
}

/* Small tablets (640px+) */
@media (min-width: 640px) {
  .automations-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

/* Tablets (768px+) */
@media (min-width: 768px) {
  .automations-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    padding: 24px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .automations-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    padding: 32px;
  }
}

/* Large desktop (1440px+) */
@media (min-width: 1440px) {
  .automations-grid {
    max-width: 1440px;
    margin: 0 auto;
  }
}
```

---

### 4.2 Mobile-Specific Optimizations

**Touch Targets**:
```css
@media (max-width: 767px) {
  /* Increase button sizes for touch */
  .btn {
    min-height: 48px;
    padding: 12px 20px;
  }
  
  /* Larger tap areas for icons */
  .btn-icon-only {
    min-width: 48px;
    min-height: 48px;
  }
  
  /* Toggle switch larger */
  .toggle-switch {
    width: 52px;
    height: 28px;
  }
}
```

**Simplified Stats on Mobile**:
```css
@media (max-width: 767px) {
  .card-stats {
    /* Stack stats vertically */
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    display: flex;
    justify-content: space-between;
    text-align: left;
  }
}
```

**Bottom Sheet for Actions**:
```css
@media (max-width: 767px) {
  /* Convert dropdown to bottom sheet */
  .dropdown-menu {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    border-radius: 16px 16px 0 0;
    max-height: 80vh;
  }
}
```

---

## 5. Dark Theme Implementation

### 5.1 Contrast Ratios (WCAG AA Compliance)

```css
/* Ensure minimum 4.5:1 contrast ratio */

/* Text on dark background */
--text-primary: #F9FAFB;    /* 18:1 ratio ✅ */
--text-secondary: #D1D5DB;  /* 12:1 ratio ✅ */
--text-tertiary: #9CA3AF;   /* 7:1 ratio ✅ */

/* Interactive elements */
--cyan-500: #06B6D4;        /* 6.5:1 ratio ✅ */
--blue-500: #3B82F6;        /* 5.2:1 ratio ✅ */
```

---

### 5.2 Glassmorphism Best Practices

```css
.glass-card {
  /* Use backdrop-filter sparingly (performance) */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  
  /* Fallback for browsers without support */
  @supports not (backdrop-filter: blur(12px)) {
    background: rgba(17, 24, 39, 0.95);
  }
  
  /* Ensure content is readable */
  background: rgba(17, 24, 39, 0.6);
  
  /* Subtle border for definition */
  border: 1px solid rgba(75, 85, 99, 0.3);
}
```

---

## Summary: Component Inventory

| Component | Variants | Use Cases |
|-----------|----------|-----------|
| Button | Primary, Secondary, Ghost, Icon | CTAs, actions, navigation |
| Input | Text, Search, Slider, Toggle | Forms, filters, settings |
| Card | Automation, Empty, Loading | Main content display |
| Dropdown | Menu, Select, Filter | Actions, options |
| Modal | Confirm, Form, Info | Dialogs, overlays |
| Toast | Success, Error, Warning, Info | Notifications |
| Badge | Performance, Status, Tier | Labels, indicators |

---

## Next Steps

Continue to **Part 4: Micro-Interactions & Animations** for:
- Animation specifications
- Transition timing
- Loading states
- Feedback patterns

---

**End of Part 3**
