# HisabBondhu mobile app

The Expo app for HisabBondhu. See the [project README](../README.md) for an overview,
features and architecture.

## Setup

```bash
cp .env.example .env   # Supabase URL and publishable key
npm install
npx expo start         # open in Expo Go
```

## Common commands

| Command                                                 | What it does                                     |
| ------------------------------------------------------- | ------------------------------------------------ |
| `npm run check`                                         | Typecheck, lint, Prettier check and Jest tests   |
| `npm test`                                              | Jest tests only                                  |
| `npm run format`                                        | Format all files with Prettier                   |
| `npx expo-doctor`                                       | Check Expo dependencies and configuration        |
| `npx eas-cli@latest build -p android --profile preview` | Build an installable APK                         |
| `npm run update:preview -- --message "..."`             | Publish an over-the-air update to preview builds |

Install new packages with `npx expo install <package>` so versions match the Expo SDK.
Changes to native parts of the app (new native packages, permissions, icon, splash,
Expo SDK upgrade) need a new build; everything else can ship as an update.
