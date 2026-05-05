import Image from 'next/image'
import React from 'react'
import { Link } from '@/i18n/routing'

export default function Logo() {
  return (
    <Link href="/">
        <Image 
          src="/logo_new.png" 
          alt="Tajma Logo" 
          width={150} 
          height={100} 
          className='w-auto h-8 sm:h-10' 
        />
    </Link>
  )
}
