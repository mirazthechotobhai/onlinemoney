export const IMGBB_API_KEY = '9cf974acba9d5d5d715bf14db07d697a';
export const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    size: number;
    time: string;
    expiration: string;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Uploads an image file to ImgBB and returns the hosted direct image URL.
 * @param file - The File object or Blob to upload
 * @returns Promise<string> - Direct URL of the uploaded image
 */
export async function uploadImageToImgBB(file: File | Blob): Promise<string> {
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);
  formData.append('image', file);

  const response = await fetch(IMGBB_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `ImgBB upload failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(message);
  }

  const result: ImgBBResponse = await response.json();

  if (!result.success || !result.data?.url) {
    throw new Error('Failed to retrieve uploaded image URL from ImgBB');
  }

  // Prefer high quality direct url or display_url
  return result.data.display_url || result.data.url;
}
