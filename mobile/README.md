# Aptechka Mobile

Expo-based mobile client scaffold for the Aptechka project.

## Start

1. Copy `.env.example` to `.env`
2. Install dependencies:

```bash
npm install
```

3. Run Expo:

```bash
npm run start
```

## Android build

The project is ready for Android app assets:

- launcher icon: `assets/app/icon.png`
- adaptive Android icon: `assets/app/adaptive-icon.png`
- native splash image: `assets/app/splash-icon.png`

Build options:

```bash
npx expo prebuild --platform android
```

For a cloud build:

```bash
npx eas build -p android --profile preview
```

`preview` creates an APK for testing, while `production` creates an Android App Bundle.

The project uses a local Android keystore via `credentials.json`, so Expo builds can run without interactive credential prompts.

## Notes

- this folder is separate from the web app in `web`
- Supabase keys use Expo public env variables
- login, registration, profile menu, inventory and calendar already use the same Supabase backend as the web version

## Recommended next steps

- continue translating the remaining mobile design screens
- replace the local screen state with Expo Router or React Navigation
- add editable account/profile flow
- add Expo Notifications for mobile push
