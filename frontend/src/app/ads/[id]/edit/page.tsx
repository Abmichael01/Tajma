import { Metadata } from 'next'
import EditAdClient from './EditAdClient'

interface EditAdPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditAdPageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Edit Ad - Tajma Marketplace',
    description: 'Edit your listing on Tajma Marketplace',
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function EditAdPage({ params }: EditAdPageProps) {
  const { id } = await params
  return <EditAdClient adId={id} />
}

