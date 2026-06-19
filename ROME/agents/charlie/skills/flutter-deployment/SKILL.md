# Flutter Deployment

**ID**: flutter-deployment
**Category**: Frontend & UI / Deployment
**Phase**: P5 (Generation) or P6 (Delivery)
**Robot**: Charlie

## Purpose

Configure Flutter apps for production deployment to App Store, Play Store, and web

## Inputs

- tech-stack.md (deployment targets)
- build configuration requirements

## Outputs

- Build flavors (dev, staging, prod)
- Environment configuration
- CI/CD pipeline setup
- App store submission assets

## Build Modes

```bash
# Debug build (development)
flutter run

# Profile build (performance testing)
flutter run --profile

# Release build (production)
flutter build apk --release
flutter build ios --release
flutter build web --release
```

## Deployment Targets

- **Android**: Play Store (AAB/APK)
- **iOS**: App Store (IPA via Xcode)
- **Web**: Firebase Hosting, Netlify, Vercel
- **Windows**: Microsoft Store, standalone installer
- **macOS**: Mac App Store, standalone installer

## Expert References

**Primary Guides** (see Experts/expert_flutter/):
- `07_DEPLOYMENT/README.md` (Deployment overview)
- Future guides for build flavors, CI/CD, app store submission

---

**Version**: 1.0
**Based on**: Experts/expert_flutter/07_DEPLOYMENT/
**Last Updated**: 2026-01-29
