import { createCloudinaryUploader } from './cloudinaryService'
export const cloudinaryUploader = createCloudinaryUploader(
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  fetch,
  import.meta.env.VITE_CLOUDINARY_FOLDER,
)
