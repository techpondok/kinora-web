/**
 * Composable for generating Table of Contents from article HTML body.
 * Parses H2/H3 headings, generates stable anchor IDs, and injects them into the HTML.
 */
import { ref, computed } from 'vue'

/**
 * Generate a URL-friendly slug from heading text.
 * Supports Indonesian characters, numbers, punctuation.
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u024F-]/g, '') // keep letters, numbers, spaces, accented chars
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'section'
}

/**
 * Parse HTML string and extract H2/H3 headings with unique IDs.
 * Returns { headings, processedHtml }
 */
export function parseArticleHeadings(html) {
  if (!html) return { headings: [], processedHtml: html }

  const headings = []
  const idCounts = {}

  // Match h2 and h3 tags, capture attributes and content
  const processed = html.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (match, tag, attrs, content) => {
      // Strip HTML tags from content to get plain text
      const text = content.replace(/<[^>]*>/g, '').trim()
      if (!text) return match

      // Generate base slug
      let baseId = slugify(text)

      // Ensure uniqueness
      if (idCounts[baseId] !== undefined) {
        idCounts[baseId]++
        baseId = `${baseId}-${idCounts[baseId]}`
      } else {
        idCounts[baseId] = 0
      }

      const level = tag.toLowerCase() === 'h2' ? 2 : 3

      headings.push({
        id: baseId,
        text,
        level,
      })

      // Inject id attribute into the heading tag
      // Remove existing id if present
      const cleanAttrs = attrs.replace(/\s*id="[^"]*"/gi, '')
      return `<${tag}${cleanAttrs} id="${baseId}">${content}</${tag}>`
    }
  )

  return { headings, processedHtml: processed }
}

/**
 * Composable that provides reactive TOC state.
 */
export function useArticleToc(articleBody) {
  const headings = ref([])
  const processedBody = ref('')
  const activeId = ref('')

  const hasToc = computed(() => {
    // Only show TOC if 2+ headings
    return headings.value.filter(h => h.level === 2).length >= 2 ||
      headings.value.length >= 3
  })

  function generate(html) {
    const result = parseArticleHeadings(html)
    headings.value = result.headings
    processedBody.value = result.processedHtml
  }

  return {
    headings,
    processedBody,
    activeId,
    hasToc,
    generate,
  }
}
