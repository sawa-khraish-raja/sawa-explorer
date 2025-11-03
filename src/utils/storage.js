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

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_${randomString}.${extension}`;

    // Create storage reference
    const storageRef = ref(storage, `${path}/${filename}`);

    // Upload file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    };

    console.log('📤 Uploading image to Firebase Storage:', `${path}/${filename}`);
    console.log('📋 File details:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      path: `${path}/${filename}`,
    });

    // Check auth before upload
    const { auth } = await import('@/config/firebase');
    const currentUser = auth.currentUser;
    console.log('🔐 Auth status:', {
      authenticated: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email,
    });

    // Get auth token to verify it exists
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        console.log('🎟️ Auth token exists:', !!token, 'Length:', token?.length);
      } catch (error) {
        console.error('❌ Failed to get auth token:', error);
      }
    } else {
      throw new Error('Not authenticated - please log in first');
    }

    // Upload the file
    console.log('⬆️ Starting upload to:', storageRef.fullPath);
    const snapshot = await uploadBytes(storageRef, file, metadata);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('✅ Image uploaded successfully:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading image to Firebase Storage:', error);
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

  // Validate file type
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only MP4, WebM, OGG, and MOV videos are allowed.');
  }

  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 50MB limit');
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}_${randomString}.${extension}`;

    // Create storage reference
    const storageRef = ref(storage, `${path}/${filename}`);

    // Upload file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    };

    console.log('📤 Uploading video to Firebase Storage:', `${path}/${filename}`);

    // Check auth before upload
    const { auth } = await import('@/config/firebase');
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('Not authenticated - please log in first');
    }

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, metadata);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log('✅ Video uploaded successfully:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading video to Firebase Storage:', error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
};
