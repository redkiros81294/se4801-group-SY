# ChainTrack Mobile

Expo SDK 50 React Native app for the ChainTrack supply chain provenance platform.

## Features

- Scan QR codes to verify product authenticity
- View batch provenance and chain validity
- Log supply chain movements (SHIPPED, IN_TRANSIT, RECEIVED)
- Secure JWT authentication with token refresh
- Dark theme matching the ChainTrack design system

## Tech Stack

- Expo SDK 50
- React Native 0.72
- React 18.2
- TypeScript 5.1
- expo-router
- expo-camera
- expo-image-picker
- expo-secure-store
- Axios

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (Android/iOS)

## Getting Started

```bash
cd mobile
npm install
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone.

## Configuration

Set the backend API URL:

```bash
EXPO_PUBLIC_API_URL=http://your-lan-ip:8080/api npx expo start
```

Or add it to `app.config.js`:

```js
export default {
  expo: {
    extra: {
      apiUrl: 'http://your-lan-ip:8080/api'
    }
  }
};
```

## Build for Production

```bash
# Build APK for Android
npx expo run:android

# Or build with EAS cloud
npx eas build --platform android --profile preview
```

## Project Structure

- `app/` — expo-router screens and navigation
- `src/screens/` — Screen components
- `src/services/` — API client and auth service
- `src/theme/` — Design tokens and global styles

## Notes

- The app targets **Android API 21+** and **iOS 13+**
- Camera permissions are required for QR scanning
- JWT tokens are stored securely using `expo-secure-store`
