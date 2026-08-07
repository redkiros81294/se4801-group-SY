import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: '#0A0F1E' },
        headerTintColor: '#F1F5F9',
        headerTitleStyle: { fontWeight: '600' },
        headerStyle: { backgroundColor: '#0D1B3E' }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="verify" options={{ title: 'Verify' }} />
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="batches" options={{ title: 'My Batches' }} />
      <Stack.Screen name="batch/[id]" options={{ title: 'Batch Detail' }} />
      <Stack.Screen name="movement" options={{ title: 'Log Movement' }} />
    </Stack>
  );
}
