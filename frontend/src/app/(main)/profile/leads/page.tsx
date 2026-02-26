import { Metadata } from 'next'
import LeadsClient from './LeadsClient'

export const metadata: Metadata = {
    title: 'Potential Clients | Tajma',
    description: 'Manage your potential clients and leads on Tajma.',
}

export default function LeadsPage() {
    return <LeadsClient />
}
