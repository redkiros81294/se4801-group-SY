import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { COLORS, globalStyles } from '../theme';
import { authService } from '../services/auth';
import api from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', {
        username: email,
        password
      });
      const { token, refreshToken } = response.data;
      await authService.saveTokens(token, refreshToken);
      router.replace('/batches');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={globalStyles.screen}>
      <View style={globalStyles.container}>
        <Text style={styles.brand}>ChainTrack</Text>
        <Text style={styles.title}>Mobile Login</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={globalStyles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={COLORS.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={globalStyles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry
        />

        <TouchableOpacity
          style={[globalStyles.button, styles.loginButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textPrimary} />
          ) : (
            <Text style={globalStyles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: COLORS.cyan,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center'
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center'
  },
  loginButton: {
    marginTop: 16
  },
  error: {
    color: COLORS.red,
    marginBottom: 12
  }
});
