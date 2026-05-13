"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import ImageUploader from '@/components/ui/ImageUploader'
import { useCreateAdminCategory } from '@/hooks/useAdmin'
import type { AdminCategory } from '@/api/admin'

interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea'
  label?: string
  placeholder?: string
  required?: boolean
  options?: string[]
}

export default function CreateCategoryDialog({ open, onOpenChange, allCategories, t }: { open: boolean, onOpenChange: (v: boolean) => void, allCategories: AdminCategory[], t: any }) {
  const createCategory = useCreateAdminCategory()
  const [formData, setFormData] = useState({ name: '', description: '', parent_id: null as number | null, category_type: 'product' as any, image_url: '', sort_order: 0, is_active: true })
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleCreate = async () => {
    setErrors({})
    if (!formData.name.trim()) { setErrors({ name: t('name_required') }); return }
    
    const customFieldsParsed = customFields.map(f => ({ name: f.name.trim(), type: f.type, label: f.label?.trim(), placeholder: f.placeholder?.trim(), required: f.required, options: f.type === 'select' ? f.options?.filter(o => o.trim() !== '') : undefined })).filter(f => f.name !== '')

    try {
      await createCategory.mutateAsync({ ...formData, custom_fields: customFieldsParsed.length > 0 ? customFieldsParsed : undefined })
      onOpenChange(false)
      setFormData({ name: '', description: '', parent_id: null, category_type: 'product', image_url: '', sort_order: 0, is_active: true })
      setCustomFields([])
    } catch (error: any) {
      if (error?.response?.data) {
        const fieldErrors: any = {}
        Object.keys(error.response.data).forEach(k => fieldErrors[k] = Array.isArray(error.response.data[k]) ? error.response.data[k][0] : error.response.data[k])
        setErrors(fieldErrors)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader><DialogTitle>{t('create_title')}</DialogTitle><DialogDescription>{t('create_desc')}</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('name_label')} *</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('name_placeholder')} className={errors.name ? 'border-red-500' : ''} />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>
          <div className="space-y-2"><Label>{t('description_label')}</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={t('description_placeholder')} rows={3} /></div>
          <div className="space-y-2">
            <Label>{t('parent_label')}</Label>
            <Select value={formData.parent_id?.toString() || 'none'} onValueChange={(v) => setFormData({ ...formData, parent_id: v === 'none' ? null : parseInt(v) })}>
              <SelectTrigger><SelectValue placeholder={t('parent_placeholder')} /></SelectTrigger>
              <SelectContent><SelectItem value="none">{t('none_root')}</SelectItem>{allCategories.map((cat) => (<SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('type_label')} *</Label>
            <Select value={formData.category_type} onValueChange={(v) => setFormData({ ...formData, category_type: v })}>
              <SelectTrigger className={errors.category_type ? 'border-red-500' : ''}><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="product">{t('product')}</SelectItem><SelectItem value="service">{t('service')}</SelectItem><SelectItem value="job">{t('job')}</SelectItem><SelectItem value="cv">{t('cv')}</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <ImageUploader value={formData.image_url} onChange={(v) => setFormData({ ...formData, image_url: v || '' })} label={t('image_label')} maxSizeMB={5} aspectRatio="square" />
            <p className="text-xs text-gray-500">{t('image_desc')}</p>
          </div>
          <div className="space-y-2"><Label>{t('sort_order_label')}</Label><Input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })} min="0" /></div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between"><Label>{t('custom_fields_label')}</Label><Button variant="outline" size="sm" onClick={() => setCustomFields([...customFields, { id: Date.now().toString(), name: '', type: 'text' }])}><Plus className="w-4 h-4 mr-1" />{t('add_field')}</Button></div>
            <p className="text-xs text-gray-500">{t('custom_fields_desc')}</p>
            {customFields.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center"><p className="text-sm text-gray-500">{t('no_custom_fields')}</p><p className="text-xs text-gray-400 mt-1">{t('add_field_prompt')}</p></div>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                    <div className="flex items-center justify-between"><h4 className="text-sm font-medium text-gray-900">{t('field_index', { index: index + 1 })}</h4><Button variant="ghost" size="sm" onClick={() => setCustomFields(customFields.filter((f) => f.id !== field.id))} className="text-red-600"><Trash2 className="w-4 h-4" /></Button></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">{t('field_name_label')}</Label><Input value={field.name} onChange={(e) => { const updated = [...customFields]; updated[index].name = e.target.value; setCustomFields(updated) }} className="h-9" /></div>
                      <div className="space-y-1"><Label className="text-xs">{t('field_type_label')}</Label>
                        <Select value={field.type} onValueChange={(v: any) => { const updated = [...customFields]; updated[index].type = v; if (v === 'select' && !updated[index].options) updated[index].options = []; setCustomFields(updated) }}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="number">Number</SelectItem><SelectItem value="select">Select</SelectItem><SelectItem value="checkbox">Checkbox</SelectItem><SelectItem value="textarea">Text Area</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2"><Checkbox id="is_active" checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v === true })} /><Label htmlFor="is_active">{t('is_active_label')}</Label></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button><Button onClick={handleCreate} disabled={createCategory.isPending}>{t('common.create')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
