"use client"
import { Link } from '@/i18n/routing'

import React, { useState } from 'react'
import { useUserReports, useAddReportMessage, Report, ReportMessage } from '@/hooks/useReports'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Clock, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

export default function ProfileSupport() {
  const { data: reportsData, isLoading } = useUserReports()
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const addMessage = useAddReportMessage()

  const reports = reportsData?.results || []
  const selectedReport = reports.find((r: Report) => r.id === selectedReportId)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !selectedReportId) return
    try {
      await addMessage.mutateAsync({ reportId: selectedReportId, message })
      setMessage('')
    } catch (err) {}
  }

  if (isLoading) return <div className="py-20 flex justify-center"><MarketplaceLoader size="md" /></div>

  if (reports.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-[32px] p-6 sm:p-10 max-w-4xl mx-auto">
        <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
          <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-gray-100 transition-transform hover:scale-105 duration-300">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/5 to-transparent opacity-50" />
            <MessageSquare className="w-10 h-10 text-gray-300 relative z-10" />
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-white">
              0
            </div>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">
            No support tickets yet
          </h3>
          <p className="text-gray-500 max-w-xs leading-relaxed text-sm mb-8">
            Need help? Open a support ticket to get assistance from our team.
          </p>
          <Button asChild variant="primary" size="lg" className="rounded-full px-8 shadow-md hover:shadow-lg transition-all active:scale-95">
            <Link href="/contact" className="flex items-center justify-center">
              <Send className="w-4 h-4 mr-2" />
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar - Ticket List */}
      <div className="lg:col-span-1 space-y-4">
        {reports.map((report: Report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReportId(report.id)}
            className={`w-full text-left p-6 border rounded-[32px] transition-all ${
              selectedReportId === report.id 
                ? 'bg-primary/5 border-primary shadow-sm' 
                : 'bg-white border-gray-200 hover:border-primary/50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <Badge variant="outline" className="capitalize text-[10px] px-2 py-0">
                {report.report_type}
              </Badge>
              <Badge className={
                report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }>
                {report.status.replace('_', ' ')}
              </Badge>
            </div>
            <h4 className="font-bold text-gray-900 truncate mb-1">
              {report.description.split('\n')[0].replace('[Subject: ', '').replace(']', '') || 'Support Request'}
            </h4>
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {format(new Date(report.created_at), 'MMM d, yyyy')}
            </div>
          </button>
        ))}
      </div>

      {/* Main Content - Chat Area */}
      <div className="lg:col-span-2">
        {selectedReport ? (
          <div className="bg-white border border-gray-200 rounded-[32px] flex flex-col h-[600px] overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div>
                <h3 className="font-bold text-gray-900">Ticket Details</h3>
                <p className="text-xs text-gray-500">ID: {selectedReport.id.slice(0, 8).toUpperCase()}</p>
              </div>
              {selectedReport.status === 'resolved' && (
                <div className="flex items-center text-green-600 font-bold text-sm">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Resolved
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/10 flex flex-col">
              {/* Initial Report Description */}
              <div className="bg-gray-100 rounded-[24px] p-4 max-w-[85%] self-start shadow-sm border border-gray-200">
                 <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedReport.description}</p>
                 <span className="text-[10px] text-gray-500 mt-2 block italic">Initial Request</span>
              </div>

              {selectedReport.messages.map((msg: ReportMessage) => (
                <div 
                  key={msg.id} 
                  className={`max-w-[85%] rounded-[24px] p-4 ${
                    msg.is_admin_reply 
                      ? 'bg-primary text-white self-start ml-2 shadow-md' 
                      : 'bg-white border border-gray-200 self-end mr-2 shadow-sm ml-auto text-gray-800'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <span className={`text-[10px] mt-2 block ${msg.is_admin_reply ? 'text-white/70' : 'text-gray-400'}`}>
                    {msg.is_admin_reply ? 'Tajma Support' : 'You'} • {format(new Date(msg.created_at), 'HH:mm')}
                  </span>
                </div>
              ))}
            </div>

            {/* Input Area */}
            {selectedReport.status !== 'resolved' && (
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2">
                  <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 h-12 rounded-full px-6 border-gray-200 focus:ring-primary shadow-inner"
                  />
                  <Button 
                    type="submit" 
                    className="w-12 h-12 rounded-full p-0 shadow-lg transition-all hover:scale-105 active:scale-95"
                    disabled={addMessage.isPending || !message.trim()}
                  >
                    <Send className="w-5 h-5 pointer-events-none" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-[32px] h-[600px] flex items-center justify-center text-center p-12">
            <div className="max-w-xs">
              <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                 <MessageSquare className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Select a ticket</h3>
              <p className="text-gray-500 mt-2 text-sm">Choose a support ticket from the list to view the conversation and track progress.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
