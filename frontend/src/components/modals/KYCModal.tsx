"use client"

import React, { useEffect, useState, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { kycApi } from '@/api/kyc'
import { Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

interface KYCModalProps {
    isOpen: boolean
    onClose: () => void
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'smile-id-smart-camera': any
        }
    }
}

export default function KYCModal({ isOpen, onClose }: KYCModalProps) {
    const [step, setStep] = useState<'intro' | 'choice' | 'capturing' | 'success' | 'error'>('intro')
    const [selectedId, setSelectedId] = useState<string>('NATIONAL_ID')
    const [tokenData, setTokenData] = useState<any>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const { fetchUser } = useAuthStore()

    // Custom element reference
    const cameraRef = useRef<any>(null)

    useEffect(() => {
        // Import web components only on client side
        if (typeof window !== 'undefined' && step === 'capturing') {
            import('@smileid/web-components').catch(console.error)
        }
    }, [step])

    const handleStart = async () => {
        try {
            const data = await kycApi.initiate({
                id_type: selectedId,
                country: 'NE'
            })
            setTokenData(data)
            setStep('capturing')
        } catch (error) {
            console.error('Error initiating KYC:', error)
            toast.error('Failed to start verification process')
        }
    }

    const onSmileIdEvent = (event: any) => {
        console.log('Smile ID Event:', event.detail)
        const { type, data } = event.detail

        if (type === 'success') {
            setStep('success')
            fetchUser() // Refresh user data to show pending status
        } else if (type === 'error') {
            setStep('error')
            setErrorMessage(data?.message || 'Verification failed')
        }
    }

    useEffect(() => {
        const camera = cameraRef.current
        if (camera) {
            camera.addEventListener('smile-id-event', onSmileIdEvent)
            return () => camera.removeEventListener('smile-id-event', onSmileIdEvent)
        }
    }, [step])

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Identity Verification
                    </DialogTitle>
                    <DialogDescription>
                        Securely verify your identity to build trust on Tajma.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {step === 'intro' && (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                <Shield className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="font-semibold text-lg">Verify your account</h3>
                            <p className="text-gray-500 text-sm px-6">
                                You will need a valid government-issued ID (Passport or Driver's License) from Niger.
                                The process takes less than 2 minutes.
                            </p>
                            <div className="pt-4">
                                <Button onClick={() => setStep('choice')} className="w-full">
                                    Start Verification
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'choice' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-center">Select ID Type</h3>
                            <div className="grid gap-3">
                                {[
                                    { id: 'NATIONAL_ID', label: 'National ID Card (including NiNE)' },
                                    { id: 'PASSPORT', label: 'Passport' },
                                    { id: 'DRIVING_LICENSE', label: 'Driver\'s License' },
                                ].map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedId(type.id)}
                                        className={`p-4 text-left border rounded-xl transition-colors ${selectedId === type.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <p className={`font-medium ${selectedId === type.id ? 'text-primary' : 'text-gray-900'}`}>{type.label}</p>
                                    </button>
                                ))}
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button variant="ghost" onClick={() => setStep('intro')} className="flex-1">Back</Button>
                                <Button onClick={handleStart} className="flex-1">Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 'capturing' && tokenData && (
                        <div className="aspect-square bg-black rounded-lg overflow-hidden relative">
                            <smile-id-smart-camera
                                ref={cameraRef}
                                token={tokenData.token}
                                partner_id={tokenData.partner_id}
                                user_id={tokenData.user_id}
                                job_id={tokenData.job_id}
                                is_sandbox={tokenData.is_sandbox}
                                product="document_verification"
                                country="NE"
                                id_card_type={selectedId}
                            />
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-lg">Submission Received!</h3>
                            <p className="text-gray-500 text-sm">
                                We are currently reviewing your documents. This usually takes just a few minutes.
                                We will notify you once your account is verified.
                            </p>
                            <div className="pt-4">
                                <Button onClick={onClose} variant="outline" className="w-full">
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-10 h-10 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-lg">Verification Failed</h3>
                            <p className="text-gray-500 text-sm">{errorMessage}</p>
                            <div className="pt-4 flex gap-3">
                                <Button onClick={() => setStep('intro')} variant="outline" className="flex-1">
                                    Try Again
                                </Button>
                                <Button onClick={onClose} variant="ghost" className="flex-1">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
