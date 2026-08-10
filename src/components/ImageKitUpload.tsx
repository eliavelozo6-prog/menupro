import React from 'react';
import { CloudinaryUpload } from './CloudinaryUpload';

interface ImageKitUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  publicKey?: string;
  cloudName?: string;
}

// Re-exporta CloudinaryUpload como ImageKitUpload para total compatibilidade retroativa e uso do Cloudinary 874128733965488 em todo o app
export const ImageKitUpload: React.FC<ImageKitUploadProps> = ({
  imageUrl,
  onImageChange,
  cloudName = 'bxp7jdny',
}) => {
  return (
    <CloudinaryUpload
      imageUrl={imageUrl}
      onImageChange={onImageChange}
      cloudName={cloudName}
    />
  );
};

export { CloudinaryUpload };
