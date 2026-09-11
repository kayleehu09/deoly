import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import type { CreateMediaUploadResponse, PublicUserProfile, UpdateProfileInput } from '@deoly/shared';
import { apiFetch, type UserProfile } from './auth';

export type ProfileSaveStage = 'preparing' | 'uploading' | 'saving';

export function getMyProfile(token: string) {
  return apiFetch<{ user: UserProfile }>('/me', undefined, token);
}

export function getPublicProfile(userId: string, token: string) {
  return apiFetch<{ user: PublicUserProfile }>(`/users/${encodeURIComponent(userId)}`, undefined, token);
}

export async function saveProfile(
  input: UpdateProfileInput,
  photo: ImagePickerAsset | null,
  token: string,
  onStage: (stage: ProfileSaveStage) => void
) {
  let avatarObjectKey = input.avatarObjectKey;
  if (photo) {
    onStage('preparing');
    const context = ImageManipulator.manipulate(photo.uri);
    let imageUri: string;
    try {
      if (Math.max(photo.width, photo.height) > 1024) {
        context.resize(photo.width >= photo.height ? { width: 1024 } : { height: 1024 });
      }
      const rendered = await context.renderAsync();
      try {
        const image = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
        imageUri = image.uri;
      } finally { rendered.release(); }
    } finally { context.release(); }
    const response = await fetch(imageUri);
    const body = await response.blob();
    if (!body.size || body.size > 8 * 1024 * 1024) throw new Error('Choose a photo smaller than 8 MB.');
    const upload = await apiFetch<CreateMediaUploadResponse>('/media/avatar-uploads', {
      method: 'POST', body: JSON.stringify({ contentType: 'image/jpeg', byteSize: body.size })
    }, token);
    onStage('uploading');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const result = await fetch(upload.uploadUrl, {
        method: 'PUT', headers: upload.headers, body, signal: controller.signal
      });
      if (!result.ok) throw new Error('Photo upload failed. Please try again.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Photo upload took too long. Check your connection and try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
    avatarObjectKey = upload.objectKey;
  }
  onStage('saving');
  return apiFetch<{ user: UserProfile }>('/me', {
    method: 'PATCH', body: JSON.stringify({ ...input, avatarObjectKey })
  }, token);
}
