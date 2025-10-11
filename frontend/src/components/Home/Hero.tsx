import React from 'react'
import SearchBox from '../ui/SearchBox'

export default function Hero() {
    return (
        <section className="bg-white py-8 sm:py-12 lg:py-16">
            <div className="container px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Hero Text */}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight font-dmSans">
                        Let's find the{' '}
                        <span className="text-secondary">right seller</span>{' '}
                        for what you want
                    </h1>

                    {/* Search Box */}
                    <div className="max-w-lg sm:max-w-xl mx-auto">
                        <SearchBox
                            placeholder="What are you looking for today?"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
