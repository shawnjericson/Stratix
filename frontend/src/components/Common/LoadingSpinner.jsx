import React from 'react';

export default function LoadingSpinner({ size = 'medium' }) {
    const dotSize = {
        small: 'w-2 h-2',
        medium: 'w-3 h-3',
        large: 'w-4 h-4',
    };

    const currentSize = dotSize[size] || dotSize.medium;

    return (
        <div className="flex items-center space-x-1">
            <div className={`bg-blue-500 rounded-full ${currentSize} animate-bounce [animation-delay:-0.2s]`}></div>
            <div className={`bg-green-500 rounded-full ${currentSize} animate-bounce [animation-delay:0s]`}></div>
            <div className={`bg-red-500 rounded-full ${currentSize} animate-bounce [animation-delay:0.2s]`}></div>
        </div>
    );
}
