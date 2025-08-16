import React from 'react';

export default function ErrorMessage({ message, onDismiss, onRetry }) {
    return (
        <div className="flex justify-between items-start gap-4 bg-red-50 border border-red-300 text-red-800 p-4 rounded-md shadow-sm">
            {/* Icon + Message */}
            <div className="flex items-start gap-2">
                <span className="text-xl">❌</span>
                <span className="text-sm leading-snug">{message}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="text-sm px-3 py-1 border border-red-400 rounded hover:bg-red-100 transition"
                    >
                        Thử lại
                    </button>
                )}

                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="text-lg text-red-500 hover:text-red-700"
                        aria-label="Đóng"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
}
