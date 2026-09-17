/**
 * firebase-service.js — Firebase Storage Upload & Cloud Services Helper
 *
 * Provides upload services for Student Profile Avatars and Resumes.
 * Operates seamlessly with both Modular CDN and Compat SDKs.
 */

(function () {
  let modularStorageModule = null;
  let modularAppModule = null;
  let initializedModularStorage = null;

  /**
   * Helper to ensure Firebase Storage is ready.
   * Checks global compat SDK first; falls back to dynamic ES module import from gstatic CDN.
   */
  async function getStorageInstance() {
    // 1. Compat SDK check
    if (typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(window.FIREBASE_CONFIG);
      }
      return {
        type: 'compat',
        storage: firebase.storage(),
      };
    }

    // 2. Modular dynamic import
    if (!initializedModularStorage) {
      try {
        if (!modularAppModule) {
          modularAppModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
        }
        if (!modularStorageModule) {
          modularStorageModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js');
        }

        const app = modularAppModule.initializeApp(window.FIREBASE_CONFIG, 'careerpath-client-app');
        initializedModularStorage = modularStorageModule.getStorage(app);
      } catch (err) {
        console.error('Failed to load Firebase modular SDK:', err);
        throw new Error('Unable to initialize Firebase Storage. Please check internet connection.');
      }
    }

    return {
      type: 'modular',
      storage: initializedModularStorage,
      modules: {
        ref: modularStorageModule.ref,
        uploadBytes: modularStorageModule.uploadBytes,
        getDownloadURL: modularStorageModule.getDownloadURL,
      },
    };
  }

  /**
   * Upload a generic file to a destination path in Firebase Storage.
   * @param {File|Blob} file 
   * @param {string} destinationPath 
   * @param {Object} metadata 
   * @returns {Promise<string>} download URL
   */
  async function uploadFile(file, destinationPath, metadata = {}) {
    const instance = await getStorageInstance();

    try {
      if (instance.type === 'compat') {
        const storageRef = instance.storage.ref(destinationPath);
        const snapshot = await storageRef.put(file, metadata);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        return downloadUrl;
      } else {
        const { ref, uploadBytes, getDownloadURL } = instance.modules;
        const storageRef = ref(instance.storage, destinationPath);
        const snapshot = await uploadBytes(storageRef, file, metadata);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
      }
    } catch (error) {
      console.error('Firebase Storage Upload Error:', error);
      if (error.code === 'storage/unauthorized') {
        throw new Error(
          'Firebase Storage access denied. Please allow read/write in Firebase Console -> Storage -> Rules (e.g. allow read, write: if true; for testing).'
        );
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Firebase Storage quota exceeded. Please check your Firebase plan limits.');
      }
      throw new Error(error.message || 'File upload failed. Please try again.');
    }
  }

  /**
   * Upload Student Profile Picture (Avatar)
   * @param {File} file 
   * @param {string} userId 
   * @returns {Promise<string>} public download URL
   */
  async function uploadAvatar(file, userId) {
    if (!file) throw new Error('Please select an image file to upload.');

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid image format. Supported formats: JPG, PNG, WEBP, GIF, SVG.');
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Image size exceeds 5MB limit. Please choose a smaller photo.');
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `avatars/${userId || 'user'}_${Date.now()}_${sanitizedName}`;
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        userId: userId || 'anonymous',
      },
    };

    return await uploadFile(file, path, metadata);
  }

  /**
   * Upload Student Resume / CV
   * @param {File} file 
   * @param {string} userId 
   * @returns {Promise<string>} public download URL
   */
  async function uploadResume(file, userId) {
    if (!file) throw new Error('Please select a resume file to upload.');

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      throw new Error('Invalid resume format. Only PDF, DOC, or DOCX documents are accepted.');
    }

    // Validate size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Resume file size exceeds 10MB limit.');
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `resumes/${userId || 'user'}_${Date.now()}_${sanitizedName}`;
    const metadata = {
      contentType: file.type || 'application/pdf',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        userId: userId || 'anonymous',
      },
    };

    return await uploadFile(file, path, metadata);
  }

  // Expose on window
  window.FirebaseService = {
    uploadAvatar,
    uploadResume,
    uploadFile,
    getStorageInstance,
  };
})();
