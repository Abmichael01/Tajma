"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'

interface AudioPlayerProps {
    uri: string
    isOwn?: boolean
}

export default function AudioPlayer({ uri, isOwn }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const audioRef = useRef<HTMLAudioElement>(null)

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime
            const duration = audioRef.current.duration
            if (duration > 0) {
                setProgress((current / duration) * 100)
            }
        }
    }

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration)
        }
    }

    const handleEnded = () => {
        setIsPlaying(false)
        setProgress(0)
    }

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className={`flex items-center gap-3 p-2 rounded-lg min-w-[200px] ${isOwn ? 'bg-primary/20' : 'bg-gray-100'}`}>
            <button
                onClick={togglePlayback}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 ${isOwn ? 'bg-white text-primary' : 'bg-primary text-white'
                    }`}
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
            </button>

            <div className="flex-1 flex flex-col gap-1">
                <div className="h-1.5 w-full bg-gray-300 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-100 ${isOwn ? 'bg-white' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                    <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={uri}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                className="hidden"
            />
        </div>
    )
}
