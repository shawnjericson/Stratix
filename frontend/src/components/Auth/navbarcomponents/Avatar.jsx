import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, User, X, Check, AlertCircle } from 'lucide-react';

const Avatar = ({
    src,
    alt,
    size = 'w-10 h-10',
    className = '',
    fallbackText = 'U',
    editable = false,
    onAvatarChange,
    user
}) => {
    const [imageError, setImageError] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    // Handle image upload
    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Vui lòng chọn file hình ảnh');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File không được vượt quá 5MB');
            return;
        }

        setUploadError(null);

        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // Upload avatar to server
    const handleUploadConfirm = async () => {
        if (!fileInputRef.current?.files?.[0]) return;

        setUploading(true);
        setUploadError(null);

        try {
            const file = fileInputRef.current.files[0];
            const formData = new FormData();
            formData.append('avatar', file);
            formData.append('userId', user?.id);

            // Call API to upload avatar
            const response = await fetch('/api/users/avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Không thể tải lên avatar');
            }

            const data = await response.json();

            // Update avatar URL
            if (onAvatarChange) {
                onAvatarChange(data.avatar_url);
            }

            setShowUploadModal(false);
            setPreviewUrl(null);
            setImageError(false);

        } catch (error) {
            console.error('Avatar upload error:', error);
            setUploadError(error.message || 'Có lỗi xảy ra khi tải lên avatar');
        } finally {
            setUploading(false);
        }
    };

    // Reset upload state
    const handleUploadCancel = () => {
        setShowUploadModal(false);
        setPreviewUrl(null);
        setUploadError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Open file selector
    const handleEditClick = () => {
        if (editable) {
            setShowUploadModal(true);
        }
    };

    // Render avatar image or fallback
    const renderAvatar = (imageUrl, isPreview = false) => {
        if (!imageUrl || (imageError && !isPreview)) {
            return (
                <div className={`${size} bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center ${className} ${editable ? 'cursor-pointer hover:ring-2 hover:ring-amber-400 hover:ring-offset-2 transition-all duration-200' : ''}`}>
                    <span className="text-white text-sm font-bold">{fallbackText}</span>
                </div>
            );
        }

        return (
            <img
                src={imageUrl}
                alt={alt}
                className={`${size} rounded-full object-cover border border-gray-200 ${className} ${editable ? 'cursor-pointer hover:ring-2 hover:ring-amber-400 hover:ring-offset-2 transition-all duration-200' : ''}`}
                onError={() => !isPreview && setImageError(true)}
            />
        );
    };

    return (
        <>
            <div className="relative inline-block" onClick={handleEditClick}>
                {renderAvatar(src)}

                {/* Edit indicator */}
                {editable && (
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                    >
                        <Camera className="w-3 h-3 text-white" />
                    </motion.div>
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={handleUploadCancel}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900">Đổi avatar</h3>
                                <button
                                    onClick={handleUploadCancel}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Preview */}
                            <div className="flex justify-center mb-6">
                                {previewUrl ? (
                                    <div className="relative">
                                        {renderAvatar(previewUrl, true)}
                                        <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center">
                                            <Check className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    renderAvatar(src)
                                )}
                            </div>

                            {/* File Input */}
                            <div className="mb-6">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all duration-200"
                                >
                                    <Upload className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-700 font-medium">
                                        {previewUrl ? 'Chọn ảnh khác' : 'Chọn ảnh từ máy tính'}
                                    </span>
                                </button>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Hỗ trợ JPG, PNG. Tối đa 5MB.
                                </p>
                            </div>

                            {/* Error Message */}
                            {uploadError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{uploadError}</p>
                                </motion.div>
                            )}

                            {/* Actions */}
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleUploadCancel}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                                    disabled={uploading}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleUploadConfirm}
                                    disabled={!previewUrl || uploading}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Đang tải lên...</span>
                                        </>
                                    ) : (
                                        <span>Cập nhật</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Avatar;