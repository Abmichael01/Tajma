import Image from 'next/image'
import React from 'react'
import Link from 'next/link'

export default function Logo() {
  return (
    <Link href="/">
        <Image src="/logo.jpg" alt="Logo" width={100} height={100} className='w-auto' />
    </Link>
  )
}
