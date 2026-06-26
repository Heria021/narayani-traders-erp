'use client'

import { useState, useRef } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Upload, Trash2, CheckCircle, AlertCircle, Loader2, Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QueuedImage {
  id: string
  file: File
  previewUrl: string
  caption: string
  status: 'pending' | 'uploading' | 'success' | 'failed'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  uploadMedia: (file: File, caption: string) => Promise<boolean>
}

export function MediaUploadSheet({ open, onOpenChange, uploadMedia }: Props) {
  const [queue, setQueue] = useState<QueuedImage[]>([])
  const [isUploadingAll, setIsUploadingAll] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    
    const newItems: QueuedImage[] = filesArray.map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
      status: 'pending'
    }))

    setQueue(prev => [...prev, ...newItems])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeQueuedItem = (item: QueuedImage) => {
    URL.revokeObjectURL(item.previewUrl)
    setQueue(prev => prev.filter(q => q.id !== item.id))
  }

  const updateCaption = (id: string, caption: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, caption } : q))
  }

  // Upload an individual image
  const uploadSingle = async (item: QueuedImage) => {
    if (item.status === 'uploading' || item.status === 'success') return
    
    // Update state to uploading
    setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q))

    const success = await uploadMedia(item.file, item.caption)

    // Update state on completion
    setQueue(prev => prev.map(q => {
      if (q.id === item.id) {
        return { ...q, status: success ? 'success' : 'failed' }
      }
      return q
    }))
  }

  // Upload all pending/failed items in sequence
  const uploadAll = async () => {
    if (queue.length === 0 || isUploadingAll) return
    setIsUploadingAll(true)

    const itemsToUpload = queue.filter(q => q.status === 'pending' || q.status === 'failed')

    for (const item of itemsToUpload) {
      // Set single item state to uploading
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q))

      const success = await uploadMedia(item.file, item.caption)

      // Set single item state to result
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: success ? 'success' : 'failed' } : q))
    }

    setIsUploadingAll(false)
  }

  const clearQueue = () => {
    queue.forEach(item => URL.revokeObjectURL(item.previewUrl))
    setQueue([])
  }

  const totalPending = queue.filter(q => q.status === 'pending' || q.status === 'failed').length
  const totalUploaded = queue.filter(q => q.status === 'success').length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none lg:w-[800px] lg:max-w-[800px] h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] m-4 rounded-xl border flex flex-col p-0 overflow-hidden shadow-xl"
      >
        {/* Header */}
        <SheetHeader className="px-8 py-5 border-b shrink-0 bg-muted/10 dark:bg-muted/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 shrink-0">
              <Upload className="size-4 text-indigo-500" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold leading-tight">Upload Project Media</SheetTitle>
              <SheetDescription className="text-xs">
                Queue up project photos, write captions, and upload them singly or in bulk.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable File Queue */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-muted/5 dark:bg-muted/[0.01]">
          {/* File Picker Trigger Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed border-input rounded-2xl p-8 bg-card hover:bg-muted/10',
              'transition-all duration-300 relative cursor-pointer flex flex-col items-center justify-center gap-2 text-center group'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex size-11 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 group-hover:scale-105 transition-transform duration-300">
              <Upload className="size-5 text-indigo-500" />
            </div>
            <span className="text-sm font-semibold text-foreground mt-1">Select project photos</span>
            <span className="text-xs text-muted-foreground">Click to browse your files (supports multiple select, JPEG/PNG/WEBP)</span>
          </div>

          {/* Queue List */}
          {queue.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Upload Queue ({queue.length} file{queue.length !== 1 ? 's' : ''})</span>
                {totalUploaded > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 normal-case">{totalUploaded} successfully uploaded</span>
                )}
              </div>
              <div className="space-y-3">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-4 rounded-xl border bg-card p-4 transition-all',
                      item.status === 'success' && 'border-emerald-100 bg-emerald-50/10 dark:border-emerald-500/10 dark:bg-emerald-500/5',
                      item.status === 'failed' && 'border-red-100 bg-red-50/10 dark:border-red-500/10 dark:bg-red-500/5'
                    )}
                  >
                    {/* Thumbnail preview */}
                    <div className="relative size-16 rounded-lg overflow-hidden border shrink-0 bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.previewUrl} alt="Thumbnail" className="object-cover w-full h-full" />
                    </div>

                    {/* Meta + Caption Input */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        {item.status !== 'uploading' && item.status !== 'success' && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeQueuedItem(item)}
                            className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>

                      {item.status !== 'success' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Add photo caption..."
                            value={item.caption}
                            onChange={(e) => updateCaption(item.id, e.target.value)}
                            disabled={item.status === 'uploading'}
                            className="text-xs h-8 bg-muted/20"
                          />
                        </div>
                      ) : (
                        item.caption && (
                          <p className="text-xs text-muted-foreground italic font-medium">
                            Caption: &ldquo;{item.caption}&rdquo;
                          </p>
                        )
                      )}
                    </div>

                    {/* Actions and Status indicators */}
                    <div className="flex flex-col items-end gap-2 shrink-0 self-center">
                      {item.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => uploadSingle(item)}
                          className="h-8 text-xs font-semibold px-3"
                        >
                          Upload
                        </Button>
                      )}

                      {item.status === 'uploading' && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold px-2">
                          <Loader2 className="size-3.5 animate-spin" /> Uploading…
                        </div>
                      )}

                      {item.status === 'success' && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-2">
                          <CheckCircle className="size-3.5 animate-none" /> Uploaded
                        </div>
                      )}

                      {item.status === 'failed' && (
                        <div className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-semibold px-2">
                            <AlertCircle className="size-3.5" /> Failed
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => uploadSingle(item)}
                            className="h-7 text-[10px] px-2"
                          >
                            Retry
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <ImageIcon className="size-16 stroke-[1.2] text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold">No images in queue</p>
              <p className="text-xs mt-1">Select project images using the card above to build your upload list.</p>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between px-8 py-4 border-t shrink-0 bg-background">
          <Button
            variant="ghost"
            onClick={clearQueue}
            disabled={queue.length === 0 || isUploadingAll}
            className="text-xs h-9 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            Clear List
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploadingAll}
              className="text-xs h-9"
            >
              Done
            </Button>
            {totalPending > 0 && (
              <Button
                disabled={isUploadingAll}
                onClick={uploadAll}
                className="bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90 text-xs h-9 font-semibold"
              >
                {isUploadingAll ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" /> Uploading All…
                  </span>
                ) : `Upload All (${totalPending})`}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
