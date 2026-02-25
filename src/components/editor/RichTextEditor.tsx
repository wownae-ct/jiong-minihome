'use client'

import { useCallback, useRef, useState, useEffect, DragEvent } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Underline } from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Youtube from '@tiptap/extension-youtube'
import { common, createLowlight } from 'lowlight'
import { Icon } from '@/components/ui/Icon'
import { EditorToolbar } from './EditorToolbar'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  label?: string
  error?: string
  editable?: boolean
  onImageUpload?: (file: File) => Promise<string>
  onVideoUpload?: (file: File) => Promise<string>
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요...',
  label,
  error,
  editable = true,
  onImageUpload,
  onVideoUpload,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploadingDrop, setIsUploadingDrop] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full h-auto rounded-lg' },
      }),
      TextStyle,
      Color,
      Underline,
      CodeBlockLowlight.configure({ lowlight }),
      Youtube.configure({
        HTMLAttributes: { class: 'w-full aspect-video rounded-lg' },
        width: 640,
        height: 360,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      handlePaste: (view, event) => {
        if (!onImageUpload) return false

        const items = event.clipboardData?.items
        if (!items) return false

        const imageItems = Array.from(items).filter((item) => item.type.startsWith('image/'))
        if (imageItems.length === 0) return false

        event.preventDefault()

        const processImages = async () => {
          for (const item of imageItems) {
            const file = item.getAsFile()
            if (!file || file.size > 5 * 1024 * 1024) continue

            try {
              const url = await onImageUpload(file)
              const { state } = view
              const { tr } = state
              const pos = state.selection.from
              const node = state.schema.nodes.image?.create({ src: url })
              if (node) view.dispatch(tr.insert(pos, node))
            } catch {
              // 에러 처리는 onImageUpload에서 담당
            }
          }
        }

        processImages()
        return true
      },
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
  })

  // 외부에서 content prop이 변경되면 에디터 내용 동기화
  useEffect(() => {
    if (!editor) return

    // 에디터 현재 내용과 prop 내용이 다를 때만 업데이트
    const currentContent = editor.getHTML()
    if (content !== currentContent) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !onImageUpload || !editor) return

      try {
        const url = await onImageUpload(file)
        editor.chain().focus().setImage({ src: url }).run()
      } catch {
        // 에러 처리는 onImageUpload에서 담당
      }

      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [editor, onImageUpload]
  )

  const handleVideoUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file || !onVideoUpload || !editor) return

      try {
        const url = await onVideoUpload(file)
        // video 태그를 HTML로 삽입
        editor
          .chain()
          .focus()
          .insertContent(
            `<video controls class="max-w-full rounded-lg"><source src="${url}" type="${file.type}"></video>`
          )
          .run()
      } catch {
        // 에러 처리는 onVideoUpload에서 담당
      }

      if (videoInputRef.current) videoInputRef.current.value = ''
    },
    [editor, onVideoUpload]
  )

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (!editor) return

      const files = e.dataTransfer.files
      if (!files || files.length === 0) return

      setIsUploadingDrop(true)
      try {
        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/') && onImageUpload) {
            if (file.size > 5 * 1024 * 1024) continue
            const url = await onImageUpload(file)
            editor.chain().focus().setImage({ src: url }).run()
          } else if (file.type.startsWith('video/') && onVideoUpload) {
            if (file.size > 50 * 1024 * 1024) continue
            const url = await onVideoUpload(file)
            editor
              .chain()
              .focus()
              .insertContent(
                `<video controls class="max-w-full rounded-lg"><source src="${url}" type="${file.type}"></video>`
              )
              .run()
          }
        }
      } catch {
        // 에러 처리는 콜백에서 담당
      } finally {
        setIsUploadingDrop(false)
      }
    },
    [editor, onImageUpload, onVideoUpload]
  )

  if (!editor) return null

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div
        className={`
          border rounded-lg overflow-hidden
          ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}
          focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary
        `}
      >
        {editable && (
          <EditorToolbar
            editor={editor}
            fileInputRef={fileInputRef}
            videoInputRef={videoInputRef}
            onImageUpload={handleImageUpload}
            onVideoUpload={onVideoUpload ? handleVideoUpload : undefined}
          />
        )}

        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative ${isDragging ? 'ring-2 ring-primary ring-inset' : ''}`}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <Icon name="cloud_upload" className="text-primary" />
                <span className="text-primary font-medium">파일을 놓으세요</span>
              </div>
            </div>
          )}
          {isUploadingDrop && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-slate-600 dark:text-slate-400">업로드 중...</span>
              </div>
            </div>
          )}
          <EditorContent editor={editor} className="bg-white dark:bg-slate-800" />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
