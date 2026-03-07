import { describe, it, expect } from 'vitest'
import { highlightCodeBlocks } from './highlight-code'

describe('highlightCodeBlocks', () => {
  it('returns empty string for empty input', () => {
    expect(highlightCodeBlocks('')).toBe('')
  })

  it('returns html unchanged when no code blocks', () => {
    const html = '<p>Hello world</p>'
    expect(highlightCodeBlocks(html)).toBe(html)
  })

  it('highlights bash code block with language class', () => {
    const html = '<pre><code class="language-bash">echo "hello"</code></pre>'
    const result = highlightCodeBlocks(html)
    expect(result).toContain('hljs-')
    expect(result).toContain('<span')
  })

  it('highlights javascript code block', () => {
    const html = '<pre><code class="language-javascript">const x = 42;</code></pre>'
    const result = highlightCodeBlocks(html)
    expect(result).toContain('hljs-')
  })

  it('highlights typescript code block', () => {
    const html = '<pre><code class="language-typescript">const x: number = 42;</code></pre>'
    const result = highlightCodeBlocks(html)
    expect(result).toContain('hljs-')
  })

  it('auto-detects language when no class specified', () => {
    const html = '<pre><code>echo "hello world"</code></pre>'
    const result = highlightCodeBlocks(html)
    // auto-detect may or may not add hljs spans, but should not throw
    expect(result).toContain('echo')
  })

  it('preserves surrounding HTML', () => {
    const html = '<p>Before</p><pre><code class="language-bash">ls -la</code></pre><p>After</p>'
    const result = highlightCodeBlocks(html)
    expect(result).toContain('<p>Before</p>')
    expect(result).toContain('<p>After</p>')
    expect(result).toContain('hljs-')
  })

  it('handles multiple code blocks', () => {
    const html = '<pre><code class="language-bash">echo "a"</code></pre><p>middle</p><pre><code class="language-javascript">const b = 1;</code></pre>'
    const result = highlightCodeBlocks(html)
    // Both should be highlighted
    const matches = result.match(/hljs-/g)
    expect(matches!.length).toBeGreaterThanOrEqual(2)
  })

  it('handles HTML entities in code', () => {
    const html = '<pre><code class="language-bash">if [ &quot;$x&quot; &gt; 0 ]; then echo &amp; fi</code></pre>'
    const result = highlightCodeBlocks(html)
    expect(result).toContain('hljs-')
  })

  it('handles code blocks with no content', () => {
    const html = '<pre><code class="language-bash"></code></pre>'
    const result = highlightCodeBlocks(html)
    expect(result).toContain('<pre><code')
  })

  it('does not break on malformed HTML', () => {
    const html = '<pre><code class="language-bash">echo hello'
    expect(() => highlightCodeBlocks(html)).not.toThrow()
  })
})
