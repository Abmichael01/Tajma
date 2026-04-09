'use client'

import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Marker icon fix for Leaflet in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface AdMapInnerProps {
  latitude: number | string | undefined | null
  longitude: number | string | undefined | null
  title?: string
  locationName?: string
}

export default function AdMapInner({ latitude, longitude, title, locationName }: AdMapInnerProps) {
  if (!latitude || !longitude) return null

  const position: [number, number] = [
    typeof latitude === 'string' ? parseFloat(latitude) : latitude,
    typeof longitude === 'string' ? parseFloat(longitude) : longitude,
  ]

  return (
    <div className="w-full h-80 rounded-3xl overflow-hidden shadow-sm border border-slate-100 z-0">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={icon}>
          <Popup>
            <div className="p-1">
              <h3 className="font-bold text-sm">{title}</h3>
              {locationName && <p className="text-xs text-slate-500">{locationName}</p>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
