import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { storage } from '@/config/firebase';

/**
 * Upload an image file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} path - The storage path (e.g., 'adventures/images', 'reviews/photos')
 * @returns {Promise<string>} The public download URL of the uploaded file
 */
export const uploadImage = async (file, path = 'uploads') => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  if (!(file instanceof File) && !(file instanceof Blob)) {
    throw new Error('Invalid file object provided');
  }

  const fileType = file.type || '';
  const fileName = file.name || `upload_${Date.now()}`;

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!fileType || !validTypes.includes(fileType)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
  }

  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }

  try {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const nameParts = fileName.split('.');
    const extension = nameParts.length > 1 ? nameParts.pop() : 'jpg';
    const filename = `${timestamp}_${randomString}.${extension}`;

    const storageRef = ref(storage, `${path}/${filename}`);

    const metadata = {
      contentType: fileType,
      customMetadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    };

    const { auth } = await import('@/config/firebase');
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('Not authenticated - please log in first');
    }

    try {
      await currentUser.getIdToken(true);
    } catch (error) {
      throw new Error('Authentication error - please log in again');
    }

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Upload multiple images to Firebase Storage
 * @param {File[]} files - Array of files to upload
 * @param {string} path - The storage path
 * @returns {Promise<string[]>} Array of download URLs
 */
export const uploadImages = async (files, path = 'uploads') => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map((file) => uploadImage(file, path));
  return Promise.all(uploadPromises);
};

/**
 * Upload a video file to Firebase Storage
 * @param {File} file - The video file to upload
 * @param {string} path - The storage path (e.g., 'hero-slides/videos')
 * @returns {Promise<string>} The public download URL of the uploaded video
 */
export const uploadVideo = async (file, path = 'videos') => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  if (!(file instanceof File) && !(file instanceof Blob)) {
    throw new Error('Invalid file object provided');
  }

  const fileType = file.type || '';
  const fileName = file.name || `upload_${Date.now()}`;

  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  if (!fileType || !validTypes.includes(fileType)) {
    throw new Error('Invalid file type. Only MP4, WebM, OGG, and MOV videos are allowed.');
  }

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 50MB limit');
  }

  try {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const nameParts = fileName.split('.');
    const extension = nameParts.length > 1 ? nameParts.pop() : 'mp4';
    const filename = `${timestamp}_${randomString}.${extension}`;

    const storageRef = ref(storage, `${path}/${filename}`);

    const metadata = {
      contentType: fileType,
      customMetadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
      },
    };

    const { auth } = await import('@/config/firebase');
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('Not authenticated - please log in first');
    }

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading video to Firebase Storage:', error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
};
