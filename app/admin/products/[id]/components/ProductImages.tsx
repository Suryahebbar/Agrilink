'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FiImage } from 'react-icons/fi';

interface ProductImagesProps {
  images: Array<{ url: string; alt?: string }>;
  productName: string;
}

export default function ProductImages({ images, productName }: ProductImagesProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <FiImage className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full h-64 md:h-96 bg-white rounded-lg overflow-hidden border border-gray-200">
        <Image
          src={images[currentImageIndex].url}
          alt={images[currentImageIndex].alt || `${productName} - Image ${currentImageIndex + 1}`}
          fill
          className="object-contain"
          priority
        />
      </div>
      
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto py-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                currentImageIndex === index ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || `${productName} - Thumbnail ${index + 1}`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
