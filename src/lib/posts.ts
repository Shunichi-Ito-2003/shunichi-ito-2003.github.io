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
  series?: string;       // シリーズ名（例「カンヌへの道」）。連番タイトルのみ
  seriesLabel?: string;  // 表示用ラベル（例「#08」「番外編」）
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

// タイトル末尾の【シリーズ名-番号】からシリーズ情報を抽出する。
//   【カンヌへの道-08】   → { series: 'カンヌへの道', seriesLabel: '#08' }
//   【カンヌへの道-番外編】 → { series: 'カンヌへの道', seriesLabel: '番外編' }
//   【永久保存版】         → ハイフンが無い ⇒ シリーズ扱いしない（{}）
// 最後のハイフンを区切りにするので、番号より前は名前として丸ごと取る。
function parseSeries(title: string): { series?: string; seriesLabel?: string } {
  const m = title.match(/【(.+)-([^-】]+)】/);
  if (!m) return {};
  const series = m[1].trim();
  const num = m[2].trim();
  const seriesLabel = /^[0-9]+$/.test(num) ? `#${num}` : num;
  return { series, seriesLabel };
}

let _cache: Post[] | null = null;

export function getAllPosts(): Post[] {
  if (_cache) return _cache;

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
        note_url: (data.published_url as string) || (data.note_url as string) || undefined,
        ...parseSeries(title),
      };
    })
    .filter((p) => p.title && p.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  _cache = posts;
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

// ── シリーズ・回遊性ヘルパー ──────────────────────────

// 公開記事を古い順（昇順）で返す
function publishedAsc(): Post[] {
  return [...getPublishedPosts()].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// 指定シリーズの記事を古い順（読み進め順）で返す
export function getSeriesPosts(series: string): Post[] {
  return publishedAsc().filter((p) => p.series === series);
}

export interface SeriesSummary {
  name: string;
  count: number;
  first: string;   // 最初の回の日付
  latest: string;  // 最新回の日付
  posts: Post[];   // 古い順
}

// 全シリーズの一覧。最近更新されたシリーズを先頭に並べる。
export function getSeriesList(): SeriesSummary[] {
  const map = new Map<string, Post[]>();
  for (const p of publishedAsc()) {
    if (!p.series) continue;
    const arr = map.get(p.series) ?? [];
    arr.push(p);
    map.set(p.series, arr);
  }
  const list: SeriesSummary[] = Array.from(map.entries()).map(([name, posts]) => ({
    name,
    count: posts.length,
    first: posts[0].date,
    latest: posts[posts.length - 1].date,
    posts,
  }));
  return list.sort((a, b) => new Date(b.latest).getTime() - new Date(a.latest).getTime());
}

// 全記事の時系列での前後（prev = 1つ古い記事 / next = 1つ新しい記事）
export function getAdjacentPosts(slug: string): { prev?: Post; next?: Post } {
  const asc = publishedAsc();
  const i = asc.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return { prev: asc[i - 1], next: asc[i + 1] };
}

// 同一シリーズ内での前後（prev = 前の回 / next = 次の回）
export function getAdjacentInSeries(
  slug: string
): { series?: string; prev?: Post; next?: Post } {
  const post = getPostBySlug(slug);
  if (!post?.series) return {};
  const sp = getSeriesPosts(post.series);
  const i = sp.findIndex((p) => p.slug === slug);
  if (i === -1) return { series: post.series };
  return { series: post.series, prev: sp[i - 1], next: sp[i + 1] };
}
