import { common, createLowlight } from 'lowlight'

const lowlight = createLowlight(common)

/**
 * HTML 문자열 내의 <pre><code> 블록에 lowlight 구문 강조를 적용합니다.
 * TipTap에서 저장된 HTML은 hljs 클래스 없이 평문으로 저장되므로,
 * 렌더링 시 이 함수를 통해 구문 강조를 적용합니다.
 */
export function highlightCodeBlocks(html: string): string {
  if (!html) return ''

  return html.replace(
    /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g,
    (_match, lang: string | undefined, code: string) => {
      const decoded = decodeHtmlEntities(code)

      try {
        const tree = lang
          ? lowlight.highlight(lang, decoded)
          : lowlight.highlightAuto(decoded)
        const highlighted = hastToHtml(tree)
        const langClass = lang ? ` class="language-${lang}"` : ''
        return `<pre><code${langClass}>${highlighted}</code></pre>`
      } catch {
        const langClass = lang ? ` class="language-${lang}"` : ''
        return `<pre><code${langClass}>${code}</code></pre>`
      }
    }
  )
}

interface HastNode {
  type: string
  tagName?: string
  properties?: { className?: string[] }
  children?: HastNode[]
  value?: string
}

function hastToHtml(tree: { children: HastNode[] }): string {
  return tree.children.map(nodeToHtml).join('')
}

function nodeToHtml(node: HastNode): string {
  if (node.type === 'text') {
    return escapeHtml(node.value || '')
  }
  if (node.type === 'element' && node.tagName) {
    const cls = node.properties?.className?.join(' ')
    const classAttr = cls ? ` class="${cls}"` : ''
    const children = node.children?.map(nodeToHtml).join('') || ''
    return `<${node.tagName}${classAttr}>${children}</${node.tagName}>`
  }
  return ''
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
}
