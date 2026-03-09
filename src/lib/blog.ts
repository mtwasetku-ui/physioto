import fs from 'fs'
import path from 'path'

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  author: string
  date: string
  category: string
  featured: boolean
  image: string
  content: string
  related_posts: string[]
}

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog')

function parseFrontmatter(raw: string): { data: Record<string, string | boolean | string[]>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }

  const data: Record<string, string | boolean | string[]> = {}
  match[1].split('\n').forEach((line) => {
    const [key, ...rest] = line.split(':')
    if (!key || !rest.length) return
    const value = rest.join(':').trim().replace(/^"(.*)"$/, '$1')
    // Handle inline arrays like: related_posts: ["slug-one", "slug-two"]
    if (value.startsWith('[')) {
      const items = value
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
      data[key.trim()] = items
    } else {
      data[key.trim()] = value === 'true' ? true : value === 'false' ? false : value
    }
  })

  return { data, content: match[2].trim() }
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, '')
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8')
    const { data, content } = parseFrontmatter(raw)

    return {
      slug,
      title: (data.title as string) || 'Untitled',
      excerpt: (data.excerpt as string) || (data.description as string) || '',
      author: (data.author as string) || 'Physio to Home',
      date: (data.date as string) || '',
      category: (data.category as string) || 'General',
      featured: (data.featured as boolean) || false,
      image: (data.image as string) || '',
      related_posts: (data.related_posts as string[]) || [],
      content,
    }
  })

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = parseFrontmatter(raw)

  return {
    slug,
    title: (data.title as string) || 'Untitled',
    excerpt: (data.excerpt as string) || (data.description as string) || '',
    author: (data.author as string) || 'Physio to Home',
    date: (data.date as string) || '',
    category: (data.category as string) || 'General',
    featured: (data.featured as boolean) || false,
    image: (data.image as string) || '',
    related_posts: (data.related_posts as string[]) || [],
    content,
  }
}
