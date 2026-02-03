'use client'

import { RefObject } from 'react'
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

interface EditorToolbarProps {
  editor: Editor
  fileInputRef: RefObject<HTMLInputElement | null>
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function EditorToolbar({ editor, fileInputRef, onImageUpload }: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
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

      {/* 이미지 */}
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
