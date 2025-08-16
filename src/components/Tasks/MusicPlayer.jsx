import React, { useState, useRef, useEffect } from 'react';
import {
    Music,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    X,
    Headphones,
    Radio,
    Disc3
} from 'lucide-react';

// Music playlist data
const MUSIC_PLAYLIST = [
    {
        id: 1,
        title: 'Legend of Avicii',
        artist: 'Avicii Tribute Mix',
        url: 'https://res.cloudinary.com/dfnlmwmqj/video/upload/v1754490405/Tim_Bergling_Tributo_a_Avicii_1989-2018_Mix_Mejores_Canciones_xxzcfb.mp3',
        cover: '/Images/legend.jpg',
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 2,
        title: 'A Green Day',
        artist: 'Green Day Hits',
        url: 'https://res.cloudinary.com/dfnlmwmqj/video/upload/v1754491114/Green_Day_Top_Hits_Barat_Paling_Banyak_di_Tonton_Tanpa_Iklan_dspdf2.mp3',
        cover: '/Images/greenday.jpg',
        color: 'from-green-500 to-blue-500'
    },
    {
        id: 3,
        title: 'We are Dragon',
        artist: 'Imagine Dragons',
        url: 'https://res.cloudinary.com/dfnlmwmqj/video/upload/v1754491116/Imagine_Dragons_Playlist_2024_-_Best_songs_-_Top_10_GREATEST_HITS_SONGS_-_Best_of_Imagine_Dragons_ulltb8.mp3',
        cover: '/Images/dragon.jpg',
        color: 'from-red-500 to-orange-500'
    },
    {
        id: 4,
        title: 'Phonk your day',
        artist: 'Phonk Mix',
        url: 'https://res.cloudinary.com/dfnlmwmqj/video/upload/v1754491330/music_ruwhvp.mp3',
        cover: '/Images/phonk.jpg',
        color: 'from-gray-600 to-purple-600'
    }
];

// Music Selection Modal
const MusicSelectionModal = ({ isOpen, onClose, onSelectMusic, currentTrack }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#FBBF77] to-[#F59E0B] text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Music className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Focus Mode</h3>
                                <p className="text-orange-100">Choose music to boost productivity</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Music List */}
                <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
                    {MUSIC_PLAYLIST.map((track) => (
                        <button
                            key={track.id}
                            onClick={() => onSelectMusic(track)}
                            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md group ${currentTrack?.id === track.id
                                    ? 'border-[#FBBF77] bg-[#FFF7ED]'
                                    : 'border-gray-200 hover:border-[#FBBF77] hover:bg-[#FFF7ED]'
                                }`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <img
                                        src={track.cover}
                                        alt={track.title}
                                        className="w-16 h-16 rounded-xl object-cover shadow-md"
                                        onError={(e) => {
                                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="64" height="64" rx="12" fill="#FBBF77"/>
                                                    <path d="M20 24V40L36 32L20 24Z" fill="white"/>
                                                </svg>
                                            `)}`;
                                        }}
                                    />
                                    {currentTrack?.id === track.id && (
                                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-xl flex items-center justify-center">
                                            <div className="w-6 h-6 bg-[#FBBF77] rounded-full flex items-center justify-center">
                                                <Play className="w-3 h-3 text-white ml-0.5" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 text-left">
                                    <h4 className="font-semibold text-gray-900 group-hover:text-[#F59E0B] transition-colors">
                                        {track.title}
                                    </h4>
                                    <p className="text-sm text-gray-600">{track.artist}</p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Headphones className="w-5 h-5 text-gray-400" />
                                    {currentTrack?.id === track.id && (
                                        <div className="w-2 h-2 bg-[#FBBF77] rounded-full animate-pulse"></div>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                        <Radio className="w-4 h-4" />
                        <span>Background music helps improve focus and productivity</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Floating Music Player
const FloatingMusicPlayer = ({ track, isPlaying, onTogglePlay, onShowControls, showControls }) => {
    return (
        <div className="relative">
            {/* Main Player */}
            <div
                className="group cursor-pointer"
                onClick={onShowControls}
                onMouseEnter={onShowControls}
            >
                <div className={`relative w-16 h-16 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''
                    }`}>
                    {/* Album Art */}
                    <img
                        src={track.cover}
                        alt={track.title}
                        className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'scale-110' : 'scale-100'
                            }`}
                        onError={(e) => {
                            e.target.src = `data:image/svg+xml;base64,${btoa(`
                                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="64" height="64" rx="16" fill="#FBBF77"/>
                                    <path d="M20 24V40L36 32L20 24Z" fill="white"/>
                                </svg>
                            `)}`;
                        }}
                    />

                    {/* Vinyl Effect */}
                    <div className={`absolute inset-0 border-4 border-black/20 rounded-2xl ${isPlaying ? 'animate-spin' : ''
                        }`} style={{ animationDuration: '3s' }}>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black/30 rounded-full"></div>
                    </div>

                    {/* Play/Pause Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePlay();
                            }}
                            className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 text-gray-900" />
                            ) : (
                                <Play className="w-4 h-4 text-gray-900 ml-0.5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Track Info */}
                <div className="absolute -top-2 left-full ml-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <div className="font-medium">{track.title}</div>
                    <div className="text-xs opacity-75">{track.artist}</div>
                </div>
            </div>

            {/* Extended Controls */}
            {showControls && (
                <div className="absolute bottom-full left-28 transform -translate-x-1/2 mb-4 bg-white rounded-2xl shadow-2xl p-6 border border-gray-200 min-w-72 z-50">
                    {/* Track Info */}
                    <div className="text-center mb-6">
                        <h4 className="font-semibold text-gray-900 truncate">{track.title}</h4>
                        <p className="text-sm text-gray-600 truncate">{track.artist}</p>
                    </div>

                    {/* Volume Control */}
                    <div className="mb-6">
                        <div className="flex items-center space-x-3">
                            <Volume2 className="w-4 h-4 text-gray-400" />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                defaultValue="70"
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FBBF77]"
                                style={{
                                    background: `linear-gradient(to right, #FBBF77 0%, #FBBF77 70%, #E5E7EB 70%, #E5E7EB 100%)`
                                }}
                                onChange={(e) => {
                                    const event = new CustomEvent('volumeChange', { detail: e.target.value / 100 });
                                    window.dispatchEvent(event);
                                    // Update slider background
                                    e.target.style.background = `linear-gradient(to right, #FBBF77 0%, #FBBF77 ${e.target.value}%, #E5E7EB ${e.target.value}%, #E5E7EB 100%)`;
                                }}
                            />
                            <span className="text-xs text-gray-500 w-8">100%</span>
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center space-x-4 mb-4">
                        <button
                            onClick={() => {
                                const event = new CustomEvent('previousTrack');
                                window.dispatchEvent(event);
                            }}
                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                            title="Previous"
                        >
                            <SkipBack className="w-5 h-5 text-gray-600" />
                        </button>

                        <button
                            onClick={onTogglePlay}
                            className="w-12 h-12 bg-[#FBBF77] hover:bg-[#F59E0B] text-white rounded-xl flex items-center justify-center transition-colors shadow-lg"
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6" />
                            ) : (
                                <Play className="w-6 h-6 ml-0.5" />
                            )}
                        </button>

                        <button
                            onClick={() => {
                                const event = new CustomEvent('nextTrack');
                                window.dispatchEvent(event);
                            }}
                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                            title="Next"
                        >
                            <SkipForward className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Stop Button */}
                    <button
                        onClick={() => {
                            const event = new CustomEvent('stopMusic');
                            window.dispatchEvent(event);
                        }}
                        className="w-full py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        Stop Focus Mode
                    </button>
                </div>
            )}
        </div>
    );
};

// Main Music Player Component
export default function MusicPlayer() {
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [showMusicModal, setShowMusicModal] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    const audioRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    // Initialize audio element
    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.volume = 0.7;
        audioRef.current.addEventListener('ended', handleTrackEnd);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeEventListener('ended', handleTrackEnd);
            }
        };
    }, []);

    // Custom event listeners
    useEffect(() => {
        const handleVolumeChange = (e) => {
            if (audioRef.current) {
                audioRef.current.volume = e.detail;
            }
        };

        const handleNextTrack = () => {
            playNextTrack();
        };

        const handlePreviousTrack = () => {
            playPreviousTrack();
        };

        const handleStopMusic = () => {
            stopFocusMode();
        };

        window.addEventListener('volumeChange', handleVolumeChange);
        window.addEventListener('nextTrack', handleNextTrack);
        window.addEventListener('previousTrack', handlePreviousTrack);
        window.addEventListener('stopMusic', handleStopMusic);

        return () => {
            window.removeEventListener('volumeChange', handleVolumeChange);
            window.removeEventListener('nextTrack', handleNextTrack);
            window.removeEventListener('previousTrack', handlePreviousTrack);
            window.removeEventListener('stopMusic', handleStopMusic);
        };
    }, [currentTrackIndex]);

    const handleTrackEnd = () => {
        playNextTrack();
    };

    const startFocusMode = () => {
        setShowMusicModal(true);
    };

    const selectMusic = (track) => {
        setCurrentTrack(track);
        setCurrentTrackIndex(MUSIC_PLAYLIST.findIndex(t => t.id === track.id));
        setShowMusicModal(false);
        setIsFocusMode(true);

        if (audioRef.current) {
            audioRef.current.src = track.url;
            audioRef.current.load();
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                showNotification(`🎵 Now playing: ${track.title}`, 'success');
            }).catch(error => {
                console.error('Error playing audio:', error);
                showNotification('Unable to play music. Please try again!', 'error');
            });
        }
    };

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
                showNotification('Music paused', 'info');
            } else {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    showNotification('Music resumed', 'success');
                }).catch(error => {
                    console.error('Error playing audio:', error);
                    showNotification('Unable to play music. Please try again!', 'error');
                });
            }
        }
    };

    const playNextTrack = () => {
        const nextIndex = (currentTrackIndex + 1) % MUSIC_PLAYLIST.length;
        const nextTrack = MUSIC_PLAYLIST[nextIndex];
        setCurrentTrack(nextTrack);
        setCurrentTrackIndex(nextIndex);

        if (audioRef.current) {
            audioRef.current.src = nextTrack.url;
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play().then(() => {
                    showNotification(`🎵 Now playing: ${nextTrack.title}`, 'success');
                }).catch(error => {
                    console.error('Error playing next track:', error);
                });
            }
        }
    };

    const playPreviousTrack = () => {
        const prevIndex = currentTrackIndex === 0 ? MUSIC_PLAYLIST.length - 1 : currentTrackIndex - 1;
        const prevTrack = MUSIC_PLAYLIST[prevIndex];
        setCurrentTrack(prevTrack);
        setCurrentTrackIndex(prevIndex);

        if (audioRef.current) {
            audioRef.current.src = prevTrack.url;
            audioRef.current.load();
            if (isPlaying) {
                audioRef.current.play().then(() => {
                    showNotification(`🎵 Now playing: ${prevTrack.title}`, 'success');
                }).catch(error => {
                    console.error('Error playing previous track:', error);
                });
            }
        }
    };

    const stopFocusMode = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setIsFocusMode(false);
        setIsPlaying(false);
        setCurrentTrack(null);
        setShowControls(false);
        showNotification('Focus Mode disabled. Stay productive!', 'info');
    };

    const handleShowControls = () => {
        setShowControls(true);

        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 5000);
    };

    const showNotification = (message, type) => {
        const notification = document.createElement('div');
        const colors = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            info: 'bg-[#FBBF77]'
        };

        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl transition-all duration-300 max-w-sm text-white ${colors[type] || colors.info}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    };

    return (
        <>
            {/* Focus Mode Button or Floating Player */}
            <div className="fixed bottom-20 left-6 z-40">
                {!isFocusMode ? (
                    <button
                        onClick={startFocusMode}
                        className="group bg-gradient-to-r from-[#FBBF77] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#FBBF77] text-white px-6 py-3 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-3 font-medium"
                        title="Enable Focus Mode with background music"
                    >
                        <div className="relative">
                            <Headphones className="w-6 h-6" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        </div>
                        <span className="hidden sm:inline">Focus Mode</span>
                        <div className="hidden group-hover:flex items-center space-x-1">
                            <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-4 bg-white animate-bounce" style={{ animationDelay: '100ms' }}></div>
                            <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '200ms' }}></div>
                        </div>
                    </button>
                ) : (
                    currentTrack && (
                        <FloatingMusicPlayer
                            track={currentTrack}
                            isPlaying={isPlaying}
                            onTogglePlay={togglePlayPause}
                            onShowControls={handleShowControls}
                            showControls={showControls}
                        />
                    )
                )}
            </div>

            {/* Music Selection Modal */}
            <MusicSelectionModal
                isOpen={showMusicModal}
                onClose={() => setShowMusicModal(false)}
                onSelectMusic={selectMusic}
                currentTrack={currentTrack}
            />

            {/* Focus Mode Indicator */}
            {isFocusMode && (
                <div className="fixed top-4 left-4 bg-gradient-to-r from-[#FBBF77] to-[#F59E0B] text-white px-4 py-3 rounded-xl shadow-lg z-40">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <Disc3 className="w-5 h-5" />
                            {isPlaying && (
                                <div className="absolute inset-0 animate-spin">
                                    <Disc3 className="w-5 h-5 opacity-50" />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="font-medium text-sm">Focus Mode Active</div>
                            {isPlaying && (
                                <div className="flex items-center space-x-1 mt-1">
                                    <div className="w-1 h-2 bg-white animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '100ms' }}></div>
                                    <div className="w-1 h-2 bg-white animate-bounce" style={{ animationDelay: '200ms' }}></div>
                                    <div className="w-1 h-3 bg-white animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Styles */}
            <style jsx>{`
                /* Custom slider styling */
                input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #FBBF77;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #FBBF77;
                    cursor: pointer;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                /* Smooth animations */
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeInUp {
                    animation: fadeInUp 0.3s ease-out;
                }
            `}</style>
        </>
    );
}