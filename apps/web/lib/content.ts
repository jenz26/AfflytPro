import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const guidesDirectory = path.join(process.cwd(), 'content/guides');

export interface GuideMetadata {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  keywords: string[];
  featured?: boolean;
}

export interface Guide extends GuideMetadata {
  content: string;
}

/**
 * Get all guide slugs for static generation
 */
export function getAllGuideSlugs(): string[] {
  try {
    const files = fs.readdirSync(guidesDirectory);
    const slugs: string[] = [];

    for (const filename of files) {
      if (!filename.endsWith('.md')) continue;

      const filePath = path.join(guidesDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);

      if (data.slug) {
        slugs.push(data.slug);
      }
    }

    return slugs;
  } catch {
    console.error('Error reading guides directory');
    return [];
  }
}

/**
 * Get all guides metadata (for index page)
 */
export function getAllGuides(): GuideMetadata[] {
  try {
    const files = fs.readdirSync(guidesDirectory);
    const guides: GuideMetadata[] = [];

    for (const filename of files) {
      if (!filename.endsWith('.md')) continue;

      const filePath = path.join(guidesDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);

      guides.push({
        slug: data.slug,
        title: data.title,
        description: data.description,
        category: data.category,
        readTime: data.readTime,
        publishedAt: data.publishedAt,
        updatedAt: data.updatedAt,
        author: data.author,
        keywords: data.keywords || [],
        featured: data.featured || false,
      });
    }

    // Sort by publishedAt descending
    guides.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return guides;
  } catch {
    console.error('Error reading guides');
    return [];
  }
}

/**
 * Get a single guide by slug
 */
export function getGuideBySlug(slug: string): Guide | null {
  try {
    const files = fs.readdirSync(guidesDirectory);

    for (const filename of files) {
      if (!filename.endsWith('.md')) continue;

      const filePath = path.join(guidesDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      if (data.slug === slug) {
        return {
          slug: data.slug,
          title: data.title,
          description: data.description,
          category: data.category,
          readTime: data.readTime,
          publishedAt: data.publishedAt,
          updatedAt: data.updatedAt,
          author: data.author,
          keywords: data.keywords || [],
          featured: data.featured || false,
          content,
        };
      }
    }

    return null;
  } catch {
    console.error('Error reading guide:', slug);
    return null;
  }
}

/**
 * Convert markdown to HTML (simple version)
 * For production, consider using remark/rehype or marked
 */
export function markdownToHtml(markdown: string): string {
  // Basic markdown to HTML conversion
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-white mt-8 mb-4">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-white mt-12 mb-6">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-white mt-12 mb-6">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links - internal
    .replace(/\[([^\]]+)\]\(\/([^)]+)\)/gim, '<a href="/$2" class="text-afflyt-cyan-400 hover:underline">$1</a>')
    // Links - external
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-afflyt-cyan-400 hover:underline">$1</a>')
    // Unordered lists
    .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4">$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4">$1</li>')
    // Wrap consecutive li in ul
    .replace(/(<li.*<\/li>\n?)+/gim, '<ul class="list-disc list-inside space-y-2 text-gray-300 my-4">$&</ul>')
    // Paragraphs (lines that don't start with < or are empty)
    .split('\n\n')
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<')) return block;
      return `<p class="text-gray-300 leading-relaxed mb-4">${block}</p>`;
    })
    .join('\n');

  return html;
}
