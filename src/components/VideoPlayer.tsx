import { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, X, Maximize2, Minimize2, Settings2, RotateCcw, RotateCw, Gauge } from 'lucide-react';
import { VideoData } from '@/types/game';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface VideoPlayerProps {
    video: VideoData | null;
    onClose: () => void;
    requestedTime?: number | null;
}

export default function VideoPlayer({ video, onClose, requestedTime }: VideoPlayerProps) {
    const [width, setWidth] = useState(100); // percentage
    const [isFloating, setIsFloating] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!videoRef.current || requestedTime === null || requestedTime === undefined) return;

        // Ensure requestedTime is a valid number and avoid redundant seeking
        const timeToSeek = Number(requestedTime);
        if (isNaN(timeToSeek)) return;

        try {
            videoRef.current.currentTime = timeToSeek;
            videoRef.current.play().catch(err => {
                console.warn("Video playback interrupted or blocked:", err);
            });
            setIsPlaying(true);
        } catch (error) {
            console.error("Error seeking video:", error);
        }
    }, [requestedTime]);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (!video || document.activeElement?.tagName === 'INPUT') return;
            const key = e.key.toLowerCase();
            if (videoRef.current) {
                if (e.key === 'ArrowLeft') videoRef.current.currentTime -= 5;
                if (e.key === 'ArrowRight') videoRef.current.currentTime += 5;
                if (key === 'k' || e.key === ' ') {
                    e.preventDefault();
                    togglePlay();
                }
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [video]);

    const togglePlay = () => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play();
                setIsPlaying(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    const handleSkip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    const handleSpeedChange = (speed: number) => {
        setPlaybackSpeed(speed);
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
    };

    if (!video) return null;

    const containerStyle = isFloating
        ? { width: `${width}%`, maxWidth: '600px', position: 'fixed' as const, bottom: '2rem', right: '2rem', zIndex: 100 }
        : { width: `${width}%`, maxWidth: '1000px', margin: '0 auto' };

    return (
        <Card className={`border-border bg-card overflow-hidden shadow-2xl transition-all duration-300 ${isFloating ? 'animate-in slide-in-from-right-10' : ''}`} style={containerStyle}>
            {/* Header */}
            <div className="flex items-center justify-between p-2 px-3 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                    <Play className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-bold truncate max-w-[150px] uppercase font-mono tracking-tighter">{video.titulo}</span>
                </div>

                <div className="flex items-center gap-1">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-60 hover:opacity-100">
                                <Settings2 className="w-3.5 h-3.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 space-y-4 bg-card border-border shadow-xl">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase text-muted-foreground flex justify-between">
                                    <span>Tamanho do Player</span>
                                    <span className="text-primary font-bold">{width}%</span>
                                </label>
                                <Slider
                                    value={[width]}
                                    onValueChange={(val) => setWidth(val[0])}
                                    min={30}
                                    max={100}
                                    step={1}
                                />
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-[10px] uppercase font-bold gap-2"
                                onClick={() => setIsFloating(!isFloating)}
                            >
                                {isFloating ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                                {isFloating ? 'Fixar na Grade' : 'Modo Flutuante'}
                            </Button>
                        </PopoverContent>
                    </Popover>

                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:bg-destructive/10" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Video Area */}
            <div className="aspect-video bg-black relative group">
                <video
                    ref={videoRef}
                    src={video.url}
                    autoPlay
                    playsInline
                    preload="auto"
                    className="w-full h-full cursor-pointer"
                    onClick={togglePlay}
                    onPlay={() => {
                        setIsPlaying(true);
                        if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
                    }}
                    onPause={() => setIsPlaying(false)}
                />

                {/* Custom Overlay Controls (Visible on Hover) */}
                <div className="absolute inset-x-0 bottom-0 py-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-3">
                    <div className="flex items-center gap-6">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10" onClick={() => handleSkip(-5)}>
                            <RotateCcw className="w-6 h-6" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-12 w-12 rounded-full border-2 border-white/50" onClick={togglePlay}>
                            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-10 w-10" onClick={() => handleSkip(5)}>
                            <RotateCw className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Speed Footer - Like Clipper */}
            <div className="p-2 border-t border-border flex items-center justify-between px-4 bg-secondary/10">
                <div className="flex items-center gap-2">
                    <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Playback Rate</span>
                </div>
                <div className="flex gap-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <Button
                            key={speed}
                            variant={playbackSpeed === speed ? 'default' : 'ghost'}
                            size="sm"
                            className={`h-7 px-3 text-[10px] font-bold ${playbackSpeed === speed ? 'bg-primary' : 'opacity-60 hover:opacity-100'}`}
                            onClick={() => handleSpeedChange(speed)}
                        >
                            {speed}x
                        </Button>
                    ))}
                </div>
            </div>
        </Card>
    );
}

