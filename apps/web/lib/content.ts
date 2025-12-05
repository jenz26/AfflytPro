import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const guidesDirectory = path.join(process.cwd(), 'content/guides');

// Configure marked for better rendering
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown (tables, strikethrough, etc.)
  breaks: false, // Don't convert single \n to <br> (use double newline for paragraphs)
});

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.mdx', '.md'];

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
  isMdx: boolean;
}

/**
 * Check if file has supported extension
 */
function isSupportedFile(filename: string): boolean {
  return SUPPORTED_EXTENSIONS.some(ext => filename.endsWith(ext));
}

/**
 * Get all guide slugs for static generation
 */
export function getAllGuideSlugs(): string[] {
  try {
    const files = fs.readdirSync(guidesDirectory);
    const slugs: string[] = [];

    for (const filename of files) {
      if (!isSupportedFile(filename)) continue;

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
      if (!isSupportedFile(filename)) continue;

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
      if (!isSupportedFile(filename)) continue;

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
          isMdx: filename.endsWith('.mdx'),
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
 * Convert markdown to HTML using marked
 */
export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown) as string;
}

