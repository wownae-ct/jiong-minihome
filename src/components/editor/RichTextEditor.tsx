'use client'

import { useCallback, useRef, useState, DragEvent } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Underline } from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Icon } from '@/components/ui/Icon'

const lowlight = createLowlight(common)

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  label?: string
  error?: string
  editable?: boolean
  onImageUpload?: (file: File) => Promise<string>
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  'aria-label'?: string
  'aria-pressed'?: boolean
  children: React.ReactNode
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel ?? title}
      aria-pressed={ariaPressed ?? isActive}
      className={`
        p-1.5 rounded transition-colors
        ${
          isActive
            ? 'bg-primary/20 text-primary'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요...',
  label,
  error,
  editable = true,
  onImageUpload,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploadingDrop, setIsUploadingDrop] = useState(false)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextStyle,
      Color,
      Underline,
      CodeBlockLowlight.configure({
        lowlight,
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

        // 이미지 파일 찾기
        const imageItems = Array.from(items).filter(
          (item) => item.type.startsWith('image/')
        )

        if (imageItems.length === 0) return false

        // 이미지 붙여넣기 처리 (비동기)
        event.preventDefault()

        const processImages = async () => {
          for (const item of imageItems) {
            const file = item.getAsFile()
            if (!file) continue

            // 파일 크기 검증 (5MB)
            if (file.size > 5 * 1024 * 1024) {
              continue
            }

            try {
              const url = await onImageUpload(file)
              // 에디터에 이미지 삽입
              const { state } = view
              const { tr } = state
              const pos = state.selection.from

              // Image 노드 생성 및 삽입
              const node = state.schema.nodes.image?.create({ src: url })
              if (node) {
                view.dispatch(tr.insert(pos, node))
              }
            } catch {
              // 에러 처리는 onImageUpload에서 담당
            }
          }
        }

        processImages()
        return true
      },
      attributes: {
        class:
          'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
  })

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

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [editor, onImageUpload]
  )

  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Drag & Drop 핸들러
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
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

      if (!onImageUpload || !editor) return

      const files = e.dataTransfer.files
      if (!files || files.length === 0) return

      // 이미지 파일만 필터링
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/')
      )

      if (imageFiles.length === 0) return

      setIsUploadingDrop(true)
      try {
        for (const file of imageFiles) {
          // 파일 크기 검증 (5MB)
          if (file.size > 5 * 1024 * 1024) {
            continue
          }

          const url = await onImageUpload(file)
          editor.chain().focus().setImage({ src: url }).run()
        }
      } catch {
        // 에러 처리는 onImageUpload에서 담당
      } finally {
        setIsUploadingDrop(false)
      }
    },
    [editor, onImageUpload]
  )

  if (!editor) {
    return null
  }

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
          <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            {/* 헤딩 */}
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive('heading', { level: 1 })}
              title="제목 1 (H1)"
            >
              <Icon name="format_h1" size="sm" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive('heading', { level: 2 })}
              title="제목 2 (H2)"
            >
              <Icon name="format_h2" size="sm" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive('heading', { level: 3 })}
              title="제목 3 (H3)"
            >
              <Icon name="format_h3" size="sm" />
            </ToolbarButton>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center" />

            {/* 텍스트 스타일 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="굵게 (Ctrl+B)"
            >
              <Icon name="format_bold" size="sm" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="기울임 (Ctrl+I)"
            >
              <Icon name="format_italic" size="sm" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="밑줄 (Ctrl+U)"
            >
              <Icon name="format_underlined" size="sm" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="취소선"
            >
              <Icon name="strikethrough_s" size="sm" />
            </ToolbarButton>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center" />

            {/* 목록 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="글머리 기호 목록"
            >
              <Icon name="format_list_bulleted" size="sm" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="번호 매기기 목록"
            >
              <Icon name="format_list_numbered" size="sm" />
            </ToolbarButton>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center" />

            {/* 블록 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="인용문"
            >
              <Icon name="format_quote" size="sm" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              title="코드 블록"
            >
              <Icon name="code" size="sm" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="구분선"
            >
              <Icon name="horizontal_rule" size="sm" />
            </ToolbarButton>

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center" />

            {/* 이미지 */}
            <ToolbarButton onClick={handleImageButtonClick} title="이미지 삽입">
              <Icon name="image" size="sm" />
            </ToolbarButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center" />

            {/* 실행 취소 / 다시 실행 */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="실행 취소 (Ctrl+Z)"
            >
              <Icon name="undo" size="sm" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="다시 실행 (Ctrl+Y)"
            >
              <Icon name="redo" size="sm" />
            </ToolbarButton>
          </div>
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
                <span className="text-primary font-medium">이미지를 놓으세요</span>
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
          <EditorContent
            editor={editor}
            className="bg-white dark:bg-slate-800"
          />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  )
}
