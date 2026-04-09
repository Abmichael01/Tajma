"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Play, Pause, RotateCcw } from 'lucide-react'
import { getMediaUrl } from '@/lib/utils'
import { useAudioStore } from '@/store/audioStore'

interface AudioPlayerProps {
    uri: string
    isOwn?: boolean
    id?: string // New optional ID for unique playback tracking
}

export default function AudioPlayer({ uri, isOwn, id }: AudioPlayerProps) {
    const { playingAudioId, setPlayingAudioId } = useAudioStore()
    const playbackId = id || uri
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [finished, setFinished] = useState(false)
    const audioRef = useRef<HTMLAudioElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)

    const progress = duration > 0 ? currentTime / duration : 0

    const formatTime = (t: number) => {
        if (!t || isNaN(t)) return '0:00'
        const m = Math.floor(t / 60)
        const s = Math.floor(t % 60)
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const handlePlayPause = useCallback(() => {
        const el = audioRef.current
        if (!el) return
        if (isPlaying) {
            el.pause()
            setIsPlaying(false)
            setPlayingAudioId(null)
        } else {
            if (finished) { el.currentTime = 0; setFinished(false) }
            el.play()
            setIsPlaying(true)
            setPlayingAudioId(playbackId)
        }
    }, [isPlaying, finished, playbackId, setPlayingAudioId])

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
    }

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration)
    }

    const handleEnded = () => {
        setIsPlaying(false)
        setFinished(true)
        setCurrentTime(0)
    }

    // Stop if another audio starts playing
    useEffect(() => {
        if (playingAudioId !== playbackId && isPlaying) {
            audioRef.current?.pause()
            setIsPlaying(false)
        }
    }, [playingAudioId, playbackId, isPlaying])

    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = audioRef.current
        const track = trackRef.current
        if (!el || !track || duration === 0) return
        const rect = track.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const ratio = Math.max(0, Math.min(1, clickX / rect.width))
        el.currentTime = ratio * duration
    }

    // Colors based on ownership — matching mobile exactly
    const primaryColor = isOwn ? 'white' : '#FF4F18'
    const dimColor = isOwn ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.12)'

    const PlayIcon = finished ? RotateCcw : isPlaying ? Pause : Play

    return (
        <div className="flex items-center gap-3 w-[260px] py-1 px-1">
            {/* Play/Pause Button */}
            <button
                onClick={handlePlayPause}
                className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
                style={{ backgroundColor: isOwn ? 'rgba(255,255,255,0.18)' : 'rgba(255,79,24,0.10)' }}
            >
                <PlayIcon size={20} style={{ color: primaryColor }} className={!isPlaying && !finished ? 'ml-0.5' : ''} />
            </button>

            {/* Waveform + time */}
            <div className="flex-1 flex flex-col gap-1">
                {/* Track */}
                <div
                    ref={trackRef}
                    className="relative h-5 flex items-center cursor-pointer"
                    onClick={handleTrackClick}
                >
                    {/* Background track */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full" style={{ backgroundColor: dimColor }} />
                    {/* Active fill */}
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full z-10 transition-[width] duration-100"
                        style={{ width: `${progress * 100}%`, backgroundColor: primaryColor }}
                    />
                    {/* Scrub knob */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full z-20 shadow"
                        style={{ left: `${progress * 100}%`, backgroundColor: primaryColor }}
                    />
                </div>

                {/* Time + mic icon row */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium" style={{ color: isOwn ? 'rgba(255,255,255,0.7)' : '#6B7280' }}>
                        {isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(duration)}
                    </span>
                    <Mic size={11} style={{ color: isOwn ? 'rgba(255,255,255,0.45)' : '#9CA3AF' }} />
                </div>
            </div>

            <audio
                ref={audioRef}
                src={getMediaUrl(uri)}

                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onError={(e) => {
                    console.error('Audio playback error', e)
                    setIsPlaying(false)
                    if (playingAudioId === playbackId) {
                        setPlayingAudioId(null)
                    }
                }}
                className="hidden"
            />
        </div>
    )
}
