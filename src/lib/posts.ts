import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  published: boolean;
  note_url?: string;
}

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  if (!raw.startsWith('---')) return { data: {}, content: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { data: {}, content: raw };
  const yamlBlock = raw.slice(3, end).trim();
  const content = raw.slice(end + 4).trim();
  const data: Record<string, unknown> = {};
  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (val === 'true') data[key] = true;
    else if (val === 'false') data[key] = false;
    else data[key] = val;
  }
  return { data, content };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`Content directory not found: ${CONTENT_DIR}`);
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR);
  const posts = files
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const filePath = path.join(CONTENT_DIR, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = parseFrontmatter(raw);

      const rawSlug = file.replace(/\.md$/, '');
      const filenameMatch = rawSlug.match(/^(\d{4}-\d{2}-\d{2})[\s_]*(.+)$/);

      let date = (data.date as string) || '2024-01-01';
      let title = (data.title as string) || rawSlug;
      if (filenameMatch) {
        if (!data.date) date = filenameMatch[1];
        if (!data.title) title = filenameMatch[2].trim();
      }

      const cleanContent = content
        .replace(/\n## Excalibrain Links[\s\S]*$/, '')
        .trim();

      const excerpt =
        (data.excerpt as string) ||
        cleanContent
          .replace(/^#+\s.*$/gm, '')
          .replace(/[#*`\[\]]/g, '')
          .trim()
          .slice(0, 120) + '...';

      const slug = rawSlug;

      return {
        slug,
        title,
        date,
        excerpt,
        content: cleanContent,
        category: (data.category as string) || 'Monologue',
        tags: [],
        published: (data.published as boolean) ?? false,
        note_url: (data.note_url as string) || undefined,
      };
    })
    .filter((p) => p.title && p.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPublishedPosts(): Post[] {
  return getAllPosts().filter((p) => p.published === true);
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getPostsByKeyword(keyword: string): Post[] {
  return getPublishedPosts().filter((p) => p.title.includes(keyword));
}
