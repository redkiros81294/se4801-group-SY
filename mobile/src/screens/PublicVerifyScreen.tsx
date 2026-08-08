import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { COLORS, globalStyles } from '../theme';
import api from '../services/api';

export default function PublicVerifyScreen() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const lastScanned = useRef<string | null>(null);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed to scan QR codes.');
    }
    return status === 'granted';
  };

  const verifyToken = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Enter a QR token to verify');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await api.get(`/verify/${trimmed}`);
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.status === 404
        ? 'No product found for this token. Check the code and try again.'
        : (err.response?.data?.message || 'Verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (lastScanned.current === data) return;
    lastScanned.current = data;
    verifyToken(data);
  };

  const startScanning = async () => {
    const granted = await requestCameraPermission();
    if (!granted) return;
    lastScanned.current = null;
    setScanning(true);
    setError('');
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1
    });
    if (result.canceled) return;
    setError('QR decoding from gallery is not implemented in this build.');
  };

  return (
    <View style={globalStyles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>ChainTrack</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.backLink}>Back to home</Text>
        </TouchableOpacity>
      </View>

      <View style={globalStyles.container}>
        <Text style={styles.heading}>Verify a product's journey</Text>
        <Text style={styles.subtitle}>
          Scan a QR code or paste its token below. No account needed.
        </Text>

        {scanning ? (
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={CameraType.back}
              onBarCodeScanned={handleBarCodeScanned}
              barCodeScannerSettings={{
                barCodeTypes: ['qr']
              }}
            >
              <View style={styles.scanOverlay}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
              </View>
            </Camera>
            <TouchableOpacity style={styles.stopButton} onPress={() => setScanning(false)}>
              <Text style={styles.stopButtonText}>Stop Scanner</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.cameraButton} onPress={startScanning}>
            <Text style={styles.cameraButtonText}>Start Camera Scanner</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
          <Text style={styles.secondaryButtonText}>Choose from gallery</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.label}>Product QR token</Text>
        <View style={styles.row}>
          <TextInput
            style={[globalStyles.input, styles.flex1]}
            value={token}
            onChangeText={setToken}
            placeholder="Paste token here"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={[globalStyles.button, styles.verifyButton]}
            onPress={() => verifyToken(token)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <Text style={globalStyles.buttonText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {result ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              {result.valid ? 'Authentic product' : 'Verification failed'}
            </Text>
            <Text style={styles.resultBody}>
              {result.valid
                ? "This product's provenance chain is intact and untampered."
                : "This product's chain shows signs of tampering -- treat with caution."}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Product</Text>
                <Text style={styles.metaValue}>{result.productName ?? '--'}</Text>
              </View>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Batch</Text>
                <Text style={styles.metaValue}>{result.batchNumber ?? '--'}</Text>
              </View>
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={[styles.metaValue, result.valid ? styles.green : styles.red]}>
                  {result.status ?? '--'}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bgSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  brand: {
    color: COLORS.cyan,
    fontSize: 18,
    fontWeight: '700'
  },
  backLink: {
    color: COLORS.textSecondary,
    fontSize: 14
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8
  },
  subtitle: {
    color: COLORS.textSecondary,
    marginBottom: 16
  },
  cameraContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.bgTertiary,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16
  },
  camera: {
    flex: 1
  },
  scanOverlay: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  cornerTL: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 32,
    height: 32,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.cyan
  },
  cornerTR: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 32,
    height: 32,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.cyan
  },
  cornerBL: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 32,
    height: 32,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: COLORS.cyan
  },
  cornerBR: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 32,
    height: 32,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: COLORS.cyan
  },
  cameraButton: {
    backgroundColor: COLORS.cyan,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12
  },
  cameraButtonText: {
    color: COLORS.bgPrimary,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: COLORS.bgTertiary,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 12
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600'
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  flex1: {
    flex: 1
  },
  verifyButton: {
    paddingHorizontal: 16,
    height: 44
  },
  error: {
    color: COLORS.red,
    marginTop: 12
  },
  resultCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: COLORS.bgSecondary
  },
  resultTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6
  },
  resultBody: {
    color: COLORS.textSecondary,
    marginBottom: 12
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12
  },
  metaBlock: {
    flex: 1
  },
  metaLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'uppercase'
  },
  metaValue: {
    color: COLORS.textPrimary,
    marginTop: 4,
    fontWeight: '600'
  },
  green: {
    color: COLORS.green
  },
  red: {
    color: COLORS.red
  },
  stopButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: COLORS.bgSecondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  stopButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '600'
  }
});
