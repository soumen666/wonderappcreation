# Puja Finance Manager

A mobile-friendly React/Vite application rebuilt from the supplied source code.

## Included
- Dashboard with net balance, subscription income, other income and expenses
- Subscription, income and expense CRUD
- Duplicate-entry warning
- Payment modes and received/pending status
- Search and CSV export
- Print-to-PDF support
- Local persistent storage on the device/browser
- Responsive mobile navigation

## Important note about the supplied code
The supplied file ended part-way through the Dashboard component and did not contain the complete application shell. The project therefore completes the missing UI/application flow while retaining the terminology, fields, options and behavior visible in the supplied code.

The supplied source referenced platform-injected Firebase configuration. No Firebase project configuration was included with the file, so this version uses local device storage rather than inventing Firebase credentials. Firebase synchronization can be added once the Firebase project/configuration is provided.

## Run on a computer
```bash
npm install
npm run dev
```

## Production build
```bash
npm install
npm run build
```

The production files are generated in `dist/`.

## Android APK
This package is designed to be wrapped with Capacitor or opened in Android Studio. An APK cannot be compiled in the current environment because the Android SDK/Gradle toolchain is not installed here. The project is nevertheless ready for Android packaging after installing Android Studio/SDK.
