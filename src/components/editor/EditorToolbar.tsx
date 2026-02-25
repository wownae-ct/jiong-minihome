'use client'

import { RefObject, useState, useRef, useEffect, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { Icon } from '@/components/ui/Icon'

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={`
        p-1.5 rounded transition-colors
        ${isActive
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

function ToolbarDivider() {
  return <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 self-center" />
}

const PRESET_COLORS = [
  '#000000', '#374151', '#dc2626', '#ea580c', '#d97706',
  '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#64748b',
]

const FONT_SIZES = [
  { label: '12', value: '12px' },
  { label: '14', value: '14px' },
  { label: '16', value: '16px' },
  { label: '18', value: '18px' },
  { label: '20', value: '20px' },
  { label: '24', value: '24px' },
  { label: '28', value: '28px' },
  { label: '32', value: '32px' },
]

interface EditorToolbarProps {
  editor: Editor
  fileInputRef: RefObject<HTMLInputElement | null>
  videoInputRef?: RefObject<HTMLInputElement | null>
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onVideoUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function EditorToolbar({
  editor,
  fileInputRef,
  videoInputRef,
  onImageUpload,
  onVideoUpload,
}: EditorToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showYoutubeInput, setShowYoutubeInput] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const youtubeInputRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
      if (youtubeInputRef.current && !youtubeInputRef.current.contains(e.target as Node)) {
        setShowYoutubeInput(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSetColor = useCallback(
    (color: string) => {
      editor.chain().focus().setColor(color).run()
      setShowColorPicker(false)
    },
    [editor]
  )

  const handleSetFontSize = useCallback(
    (size: string) => {
      if (size === '') {
        editor.chain().focus().unsetMark('textStyle').run()
      } else {
        editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
      }
    },
    [editor]
  )

  const handleYoutubeEmbed = useCallback(() => {
    if (!youtubeUrl.trim()) return

    editor.commands.setYoutubeVideo({ src: youtubeUrl })
    setYoutubeUrl('')
    setShowYoutubeInput(false)
  }, [editor, youtubeUrl])

  // 현재 선택된 폰트 사이즈 가져오기
  const currentFontSize = editor.getAttributes('textStyle')?.fontSize || ''

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
      {/* 헤딩 */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="제목 1 (H1)"
      >
        <Icon name="format_h1" size="sm" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="제목 2 (H2)"
      >
        <Icon name="format_h2" size="sm" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="제목 3 (H3)"
      >
        <Icon name="format_h3" size="sm" />
      </ToolbarButton>

      <ToolbarDivider />

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

      <ToolbarDivider />

      {/* 글자 색상 */}
      <div className="relative" ref={colorPickerRef}>
        <ToolbarButton
          onClick={() => setShowColorPicker(!showColorPicker)}
          isActive={showColorPicker}
          title="글자 색상"
        >
          <Icon name="format_color_text" size="sm" />
        </ToolbarButton>
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
            <div className="grid grid-cols-5 gap-1 mb-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSetColor(color)}
                  className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <input
              type="color"
              onChange={(e) => handleSetColor(e.target.value)}
              className="w-full h-7 cursor-pointer rounded"
              title="커스텀 색상"
            />
          </div>
        )}
      </div>

      {/* 글자 크기 */}
      <select
        title="글자 크기"
        value={currentFontSize}
        onChange={(e) => handleSetFontSize(e.target.value)}
        className="h-7 px-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary/50"
      >
        <option value="">기본</option>
        {FONT_SIZES.map((size) => (
          <option key={size.value} value={size.value}>
            {size.label}px
          </option>
        ))}
      </select>

      <ToolbarDivider />

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

      <ToolbarDivider />

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

      <ToolbarDivider />

      {/* 미디어 */}
      <ToolbarButton onClick={() => fileInputRef.current?.click()} title="이미지 삽입">
        <Icon name="image" size="sm" />
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        className="hidden"
      />

      {onVideoUpload && (
        <>
          <ToolbarButton onClick={() => videoInputRef?.current?.click()} title="동영상 삽입">
            <Icon name="videocam" size="sm" />
          </ToolbarButton>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={onVideoUpload}
            className="hidden"
          />
        </>
      )}

      {/* YouTube */}
      <div className="relative" ref={youtubeInputRef}>
        <ToolbarButton
          onClick={() => setShowYoutubeInput(!showYoutubeInput)}
          isActive={showYoutubeInput}
          title="YouTube 임베드"
        >
          <Icon name="smart_display" size="sm" />
        </ToolbarButton>
        {showYoutubeInput && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 w-72">
            <div className="flex gap-1">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="YouTube URL 붙여넣기"
                className="flex-1 px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleYoutubeEmbed()
                }}
              />
              <button
                type="button"
                onClick={handleYoutubeEmbed}
                className="px-2 py-1 text-sm bg-primary text-white rounded hover:bg-blue-600"
              >
                삽입
              </button>
            </div>
          </div>
        )}
      </div>

      <ToolbarDivider />

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
  )
}
