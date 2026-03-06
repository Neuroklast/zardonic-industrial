# Zardonic Cyberpunk Theme

A modular theme architecture following strict component-slot patterns for building consistent, themable UIs.

## Architecture Overview

This theme implements a **slot-based component system** where each component serves as an exchangeable building block rather than a complete page implementation.

## Component Slots

### 1. Hero.tsx
**Purpose**: The top entry area, often with parallax or 3D effects  
**Props**:
- `artistName: string` - Name to display
- `logoUrl?: string` - Optional logo image URL
- `onNavigate: (section: string) => void` - Navigation callback

### 2. Navigation.tsx
**Purpose**: The menu structure  
**Props**:
- `artistName: string` - Artist/site name
- `logoUrl?: string` - Logo for navigation bar
- `editMode?: boolean` - Whether editing is enabled
- `isOwner?: boolean` - Whether user is owner
- `showLoginButton?: boolean` - Show login button
- `onNavigate: (section: string) => void` - Navigation callback
- `onEditClick?: () => void` - Edit mode toggle
- `onLoginClick?: () => void` - Login handler
- `onArtistNameChange?: (name: string) => void` - Name change handler

### 3. Card.tsx
**Purpose**: A wrapper element for content blocks (releases, gigs, etc.)  
**Props**:
- `children: ReactNode` - Card content
- `className?: string` - Additional CSS classes
- `onClick?: () => void` - Click handler
- `dataLabel?: string` - Optional data label overlay
- `hoverable?: boolean` - Enable hover effects (default: true)
- `scanEffect?: boolean` - Enable scan line effect (default: false)

### 4. BackgroundEffects.tsx
**Purpose**: Fixed layer for visual effects  
**Important**: Uses `pointer-events-none` to avoid blocking interactions  
No props - renders global background effects

### 5. SectionDivider.tsx
**Purpose**: Visual separator between content sections  
No props - renders a themed separator

### 6. LoadingScreen.tsx
**Purpose**: Immersive loading screen  
**Props**:
- `onLoadComplete: () => void` - Callback when loading finishes
- `precacheUrls?: string[]` - Optional URLs to precache

## Design Tokens & Tailwind

**Never use static color names** like `bg-red-500` or `text-blue-300`.

The framework injects oklch color values at runtime via CSS variables. Always use semantic system colors:

### Background Colors
- `bg-background` - Main page background
- `bg-card` - Card backgrounds
- `bg-muted` - Muted/subdued backgrounds

### Text Colors
- `text-foreground` - Primary text
- `text-primary` - Brand/primary color text
- `text-accent` - Accent color text
- `text-muted-foreground` - Muted/secondary text

### Border Colors
- `border-border` - Default borders
- `border-primary` - Primary colored borders
- `border-accent` - Accent colored borders

## CSS Encapsulation

All custom CSS classes in `styles.css` are prefixed with `zardonic-theme-` to prevent global CSS collisions.

### Available Custom Classes

#### Effects
- `.zardonic-theme-scanline-effect` - CRT scanline overlay
- `.zardonic-theme-noise-effect` - Film grain noise
- `.zardonic-theme-crt-overlay` - CRT screen effect
- `.zardonic-theme-crt-vignette` - Vignette darkening
- `.zardonic-theme-full-page-noise` - Full-page noise texture
- `.zardonic-theme-periodic-noise-glitch` - Animated glitch noise

#### Logo & Glitch
- `.zardonic-theme-hero-logo-glitch` - Hero logo glitch animation
- `.zardonic-theme-hero-logo-r` - Red chromatic layer
- `.zardonic-theme-hero-logo-b` - Blue chromatic layer
- `.zardonic-theme-logo-glitch` - Generic logo glitch

#### Hover Effects
- `.zardonic-theme-hover-chromatic` - Chromatic aberration on hover
- `.zardonic-theme-hover-chromatic-image` - Image chromatic on hover
- `.zardonic-theme-hover-glitch` - Glitch effect on hover
- `.zardonic-theme-hover-noise` - Noise effect on hover
- `.zardonic-theme-hover-scan` - Scan line on hover

#### UI Elements
- `.zardonic-theme-cyber-card` - Cyberpunk styled card
- `.zardonic-theme-cyber-border` - Cyberpunk border with corners
- `.zardonic-theme-scan-line` - Animated scan line
- `.zardonic-theme-data-label` - Small data/debug label text

#### Circuit Background
- `.zardonic-theme-circuit-bg-wrapper` - Container for circuit elements
- `.zardonic-theme-circuit-line` - Circuit board lines
- `.zardonic-theme-circuit-node` - Circuit connection nodes

## Theme Registry

The `index.ts` file exports the complete theme configuration:

```typescript
import { zardonicTheme } from '@/themes/zardonic'

// Access theme properties
zardonicTheme.id          // 'zardonic-theme'
zardonicTheme.name        // 'Zardonic Cyberpunk Theme'
zardonicTheme.colors      // oklch color definitions
zardonicTheme.fonts       // Font family definitions
zardonicTheme.slots       // React component slots
```

### Theme Structure

```typescript
{
  id: 'zardonic-theme',
  name: 'Zardonic Cyberpunk Theme',
  colors: {
    primary: 'oklch(0.45 0.22 25)',
    accent: 'oklch(0.55 0.25 25)',
    background: 'oklch(0.1 0 0)',
    foreground: 'oklch(0.95 0 0)',
    // ... more colors
  },
  fonts: {
    heading: "'Orbitron', sans-serif",
    body: "'Share Tech Mono', monospace",
    mono: "'Share Tech Mono', monospace",
  },
  slots: {
    Hero,
    Navigation,
    Card,
    BackgroundEffects,
    SectionDivider,
    LoadingScreen,
  }
}
```

## Usage Example

```tsx
import { zardonicTheme } from '@/themes/zardonic'

const { Hero, Navigation, Card, BackgroundEffects } = zardonicTheme.slots

function App() {
  return (
    <div>
      <BackgroundEffects />
      <Navigation 
        artistName="Artist Name"
        onNavigate={(section) => console.log(section)}
      />
      <Hero 
        artistName="Artist Name"
        onNavigate={(section) => console.log(section)}
      />
      <Card hoverable scanEffect>
        <h2>Content Title</h2>
        <p>Card content goes here</p>
      </Card>
    </div>
  )
}
```

## Performance Considerations

### Mobile Optimizations
Heavy visual effects are automatically disabled on mobile devices (< 768px) for better performance:
- Full page noise removed
- CRT overlay removed
- Scanline effects removed
- Noise effects removed
- Glitch animations disabled

### Reduced Motion
Respects `prefers-reduced-motion` media query - all animations are disabled for users who prefer reduced motion.

### GPU Acceleration
Effects use `transform: translateZ(0)` and `will-change` for hardware acceleration where appropriate.

## Fonts Required

This theme requires these Google Fonts to be loaded in your HTML:
- **Orbitron** (weights: 400, 500, 700, 900) - Used for headings
- **Share Tech Mono** - Used for body and monospace text

```html
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
```
