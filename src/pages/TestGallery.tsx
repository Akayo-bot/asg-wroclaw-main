import React from 'react';
import DomeGallery from '@/components/admin/DomeGallery';

const TestGallery = () => {
    const images = Array.from({ length: 20 }, (_, i) => ({
        src: `https://picsum.photos/seed/${i}/400/600`,
        alt: `Image ${i}`
    }));

    return (
        <div className="w-full h-screen bg-black">
            <DomeGallery images={images} />
        </div>
    );
};

export default TestGallery;
