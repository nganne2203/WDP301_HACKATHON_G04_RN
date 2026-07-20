import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { CheckCircle2, QrCode, RotateCcw } from 'lucide-react-native';
import { participantsApi } from '../features/participants/api/participantsApi';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage } from '../core/utils/format';
import { Colors, Radius } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'QrCheckIn'>;

export function QrCheckInScreen({ route }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleBarcode(token: string) {
    if (!scanning || submitting) return;
    setScanning(false);
    setSubmitting(true);
    setError('');
    try {
      await participantsApi.scanCheckInQr(token);
      setSuccess(`Checked in successfully${route.params.eventTitle ? ` for ${route.params.eventTitle}` : ''}.`);
    } catch (scanError) {
      setError(errorMessage(scanError));
    } finally {
      setSubmitting(false);
    }
  }

  function scanAgain() {
    setSuccess('');
    setError('');
    setScanning(true);
  }

  if (!permission) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <QrCode color={Colors.primary} size={44} />
        <Text style={styles.title}>Camera access required</Text>
        <Text style={styles.description}>Allow camera access to scan the QR displayed by the competition coordinator.</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}><Text style={styles.buttonText}>Allow camera</Text></TouchableOpacity>
      </View>
    );
  }

  if (success) return <View style={styles.center}><CheckCircle2 color={Colors.green} size={58} /><Text style={styles.title}>{success}</Text></View>;

  return (
    <View style={styles.container}>
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning ? ({ data }) => handleBarcode(data) : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlay}>
        <Text style={styles.scanTitle}>Place the competition QR inside the frame</Text>
        <View style={styles.frame} />
        {submitting && <ActivityIndicator color="#fff" size="large" />}
        {!!error && <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={scanAgain} style={styles.retry}><RotateCcw color="#fff" size={17} /><Text style={styles.buttonText}>Scan again</Text></TouchableOpacity></View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', backgroundColor: Colors.background, flex: 1, justifyContent: 'center', padding: 28 },
  title: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 16, textAlign: 'center' },
  description: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: 'center' },
  button: { backgroundColor: Colors.primary, borderRadius: Radius.md, marginTop: 20, paddingHorizontal: 20, paddingVertical: 13 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  overlay: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', flex: 1, justifyContent: 'center', padding: 24 },
  scanTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 24, textAlign: 'center' },
  frame: { borderColor: '#fff', borderRadius: Radius.lg, borderWidth: 3, height: 240, marginBottom: 24, width: 240 },
  errorCard: { alignItems: 'center', backgroundColor: 'rgba(153,27,27,0.92)', borderRadius: Radius.md, padding: 16, width: '100%' },
  errorText: { color: '#fff', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retry: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 12, padding: 8 },
});
