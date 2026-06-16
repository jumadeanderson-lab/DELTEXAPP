# DeltexAI Frontend - Enterprise Security Platform

A modern, enterprise-grade cybersecurity platform frontend built with React Native, Expo, and TypeScript. Features a premium UI/UX with subscription-based feature gating and comprehensive security monitoring dashboard.

## 🎯 Features

### Core Features
- **Security Dashboard** - Real-time threat monitoring and security metrics
- **Pricing & Subscription System** - Full frontend subscription plan management
- **Settings Panel** - User preferences, security, and profile management
- **Feature Access Control** - Plan-based feature gating system
- **Enterprise Design System** - Professional, modern UI components

### Subscription Plans
- **Basic** - $9/month - Essential security monitoring
- **Standard** - $29/month - Advanced analytics & automation
- **Enterprise** - Custom pricing - Unlimited access & dedicated support

### UI Components
- Buttons, Cards, Badges, Alerts
- Status Indicators & Progress Bars
- Pricing Cards & Feature Cards
- Skeleton Loaders & Empty States
- Stat Cards & Input Components
- Stack Layout Utilities

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)

### Setup
```bash
cd DeltexApp
npm install
```

## 🚀 Running the App

### Development
```bash
npm start
```

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

### Web
```bash
npm run web
```

## 📁 Project Structure

```
src/
├── app/                    # Screen files (routing)
│   ├── _layout.tsx        # App layout with subscription provider
│   ├── index.tsx          # Dashboard/Home screen
│   ├── explore.tsx        # Pricing screen
│   └── settings.tsx       # Settings screen
├── components/            # Reusable components
│   ├── ui/               # UI component library
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   ├── status-indicator.tsx
│   │   ├── feature-card.tsx
│   │   ├── pricing-card.tsx
│   │   ├── skeleton.tsx
│   │   ├── empty-state.tsx
│   │   ├── divider.tsx
│   │   ├── progress-bar.tsx
│   │   ├── stat-card.tsx
│   │   ├── stack.tsx
│   │   └── index.ts       # Component exports
│   ├── themed-text.tsx    # Theme-aware text component
│   ├── themed-view.tsx    # Theme-aware view component
│   ├── app-tabs.tsx       # Tab navigation
│   └── ...
├── context/              # React context providers
│   └── subscription-context.tsx  # Subscription & feature gating
├── hooks/               # Custom React hooks
│   ├── use-theme.ts     # Theme hook
│   ├── use-color-scheme.ts
│   └── use-feature-access.ts
├── constants/           # Constants and theme definitions
│   └── theme.ts        # Design system (colors, typography, spacing)
└── global.css          # Global styles
```

## 🎨 Design System

### Color Palette
- **Primary (Security Blue)**: #2563EB
- **Secondary (Cyber Green)**: #10B981
- **Warning (Orange)**: #F59E0B
- **Danger (Red)**: #EF4444

### Typography
- Display, Heading 1-3, Subtitle, Body, Small, Caption
- Consistent line heights and weights

### Spacing Scale
- 0.5x (2px), 1x (4px), 2x (8px), 3x (16px), 4x (24px), 5x (32px), 6x (64px)

## 🔐 Feature Access Control

Feature access is controlled through the subscription context:

```typescript
import { useSubscription } from '@/context/subscription-context';

export function MyComponent() {
  const { currentPlan, canAccessFeature } = useSubscription();
  
  if (canAccessFeature('ai-threat-detection')) {
    // Show AI features
  }
}
```

## 📱 Platforms

The app is fully compatible with:
- ✅ Android (native)
- ✅ iOS (native)
- ✅ Web (responsive)
- ✅ Expo Go

## 🛠 Development

### Linting
```bash
npm run lint
```

### Building
For production builds, use Expo's build services:
```bash
eas build --platform android
eas build --platform ios
```

## 📝 Subscription System

The subscription system is frontend-only with mock data. Plans are:

| Feature | Basic | Standard | Enterprise |
|---------|-------|----------|-----------|
| Dashboard | ✓ | ✓ | ✓ |
| Basic Monitoring | ✓ | ✓ | ✓ |
| Advanced Analytics | ✗ | ✓ | ✓ |
| AI Threat Detection | ✗ | ✗ | ✓ |
| Team Management | ✗ | ✗ | ✓ |
| Enterprise Integrations | ✗ | ✗ | ✓ |

## 🎯 Screens

### Dashboard (`index.tsx`)
- Security metrics with real-time status
- Threat monitoring feed
- AI security intelligence section
- Quick action buttons
- Plan-based feature visibility

### Pricing (`explore.tsx`)
- Three subscription plans with detailed features
- Feature comparison table
- FAQ section
- Contact sales CTA

### Settings (`settings.tsx`)
- Subscription management
- Profile information
- Security preferences
- Notifications
- Support links
- Account management

## 🔧 Customization

To change subscription plans, edit `src/context/subscription-context.tsx`:

```typescript
export const PLAN_FEATURES = {
  basic: { /* ... */ },
  standard: { /* ... */ },
  enterprise: { /* ... */ },
};
```

To add new features to the access control system, update `FEATURE_ACCESS`:

```typescript
'my-new-feature': { minPlan: 'standard' }
```

## 📚 Component Usage Examples

### Button
```tsx
<Button
  title="Click me"
  onPress={() => console.log('Clicked')}
  variant="primary"
  fullWidth
/>
```

### Card
```tsx
<Card style={{ padding: 20 }}>
  <ThemedText>Card content</ThemedText>
</Card>
```

### Badge
```tsx
<Badge label="Premium" variant="info" size="md" />
```

### StatCard
```tsx
<StatCard
  title="Security Score"
  value="8.7/10"
  icon="🛡️"
  color="success"
  trend="up"
  trendValue="+2.3%"
/>
```

## 🐛 Troubleshooting

### Dependencies not installed
```bash
npm install
```

### Build errors
```bash
# Clear cache and rebuild
npm run reset-project
npm install
npm start
```

### TypeScript errors
Ensure `tsconfig.json` has proper JSX configuration as set by Expo.

## 📄 License

MIT

## 🤝 Contributing

1. Keep components in `src/components/ui/`
2. Export all new components in `src/components/ui/index.ts`
3. Use the design system (Colors, Spacing, Typography) from `src/constants/theme.ts`
4. Maintain TypeScript strict mode compliance

## 📞 Support

For issues or questions, check:
1. Expo documentation: https://docs.expo.dev
2. React Native docs: https://reactnative.dev
3. TypeScript docs: https://www.typescriptlang.org
