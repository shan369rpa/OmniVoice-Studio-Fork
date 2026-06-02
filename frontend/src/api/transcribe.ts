import { apiFetch, apiUrl, ApiError } from './client';

export async function transcribeAudio(file: File): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append('audio', file);
  
  const res = await apiFetch('/transcribe', {
    method: 'POST',
    body: formData,
  });
  
  return res.json();
}
