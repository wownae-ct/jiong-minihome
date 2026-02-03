import Image from 'next/image'

interface WriteButtonProps {
  onClick: () => void
  title?: string
  className?: string
}

export function WriteButton({ onClick, title = '글쓰기', className = '' }: WriteButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 bg-gradient-to-br from-primary to-blue-600 text-white rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-200 z-10 group ${className}`}
      title={title}
    >
      <Image
        src="/icons/note-icon.png"
        alt="글쓰기"
        width={20}
        height={20}
        className="invert group-hover:rotate-12 transition-transform duration-200"
      />
    </button>
  )
}
