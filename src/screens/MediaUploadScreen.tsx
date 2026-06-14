import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { FileText, UploadCloud } from 'lucide-react-native';
import { mediaService } from '../features/media/services/mediaService';
import { formatFileSize, validateUploadFile } from '../features/media/models/mediaHelpers';
import type { MediaUploadFile } from '../core/api/types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { errorMessage } from '../core/utils/format';
import { Colors, Radius, Shadow } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'MediaUpload'>;

export function MediaUploadScreen({ navigation, route }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<MediaUploadFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');

  const fileError = validateUploadFile(file);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ],
    });

    if (result.canceled) return;
    const asset = result.assets[0];
    setFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || 'application/octet-stream',
      size: asset.size,
    });
  }

  async function upload() {
    if (!title.trim()) {
      setFormError('Title is required.');
      return;
    }
    if (!file) {
      setFormError('Choose a file before uploading.');
      return;
    }
    if (fileError) {
      setFormError(fileError);
      return;
    }

    setUploading(true);
    setFormError('');
    try {
      await mediaService.upload({
        eventId: route.params.eventId,
        title,
        description,
        tags,
        file,
      });
      Alert.alert('Uploaded', 'Your media is pending moderation.');
      navigation.goBack();
    } catch (uploadError) {
      setFormError(errorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <UploadCloud color={Colors.primary} size={28} />
        <Text style={styles.title}>Upload media</Text>
        <Text style={styles.subtitle}>Images, videos, and documents are reviewed before appearing in the gallery.</Text>
      </View>

      <Input label="Title" value={title} onChangeText={setTitle} maxLength={200} />
      <Input label="Description" value={description} onChangeText={setDescription} multiline maxLength={2000} />
      <Input label="Tags" value={tags} onChangeText={setTags} placeholder="team, demo, awards" />

      <TouchableOpacity style={styles.fileBox} onPress={pickFile}>
        <FileText color={Colors.primary} size={24} />
        <View style={styles.fileText}>
          <Text style={styles.fileTitle}>{file?.name || 'Choose file'}</Text>
          <Text style={styles.fileSub}>{file ? `${file.mimeType} - ${formatFileSize(file.size)}` : 'jpg, png, webp, mp4, mov, webm, pdf, doc, ppt'}</Text>
        </View>
      </TouchableOpacity>

      {!!fileError && <Text style={styles.errorText}>{fileError}</Text>}
      {!!formError && <Text style={styles.errorText}>{formError}</Text>}

      <TouchableOpacity disabled={uploading || Boolean(fileError)} style={styles.submitButton} onPress={upload}>
        {uploading ? <ActivityIndicator color="#fff" /> : <UploadCloud color="#fff" size={17} />}
        <Text style={styles.submitText}>Upload</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Input({
  label,
  multiline,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  content: { padding: 16, paddingBottom: 28 },
  hero: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    ...Shadow.sm,
  },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 12 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  inputWrap: { marginBottom: 12 },
  inputLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  textarea: { minHeight: 92, textAlignVertical: 'top' },
  fileBox: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  fileText: { flex: 1 },
  fileTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800' },
  fileSub: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 3 },
  errorText: {
    backgroundColor: Colors.redLight,
    borderRadius: Radius.md,
    color: Colors.red,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    padding: 11,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 46,
    padding: 12,
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
