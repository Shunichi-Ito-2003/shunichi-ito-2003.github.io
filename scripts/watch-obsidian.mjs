/**
 * Obsidian → content/ 自動同期スクリプト
 *
 * 使い方:
 *   npm run watch        # 監視開始（Mac起動時に自動スタートも設定可）
 *   npm run sync         # 一回だけ同期して終了
 */

import chokidar from 'chokidar';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.join(__dirname, '..');
const OBSIDIAN_DIR = '/Users/itoushunichi/Library/Mobile Documents/iCloud~md~obsidian/Documents/新・Obsidian Starter Kit/07_note原稿';
const CONTENT_DIR = path.join(PROJECT_DIR, 'content');

const SYNC_ONLY = process.argv.includes('--sync');

// content/ ディレクトリがなければ作成
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

// frontmatterのパース（posts.tsと同じロジック）
function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: {} };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { data: {} };
  const yamlBlock = raw.slice(3, end).trim();
  const data = {};
  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (val === 'true') data[key] = true;
    else if (val === 'false') data[key] = false;
    else data[key] = val;
  }
  return { data };
}

// 1ファイルを処理：published: true ならコピー、falseなら削除
function processFile(filePath) {
  const filename = path.basename(filePath);
  if (!filename.endsWith('.md')) return false;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = parseFrontmatter(raw);
    const destPath = path.join(CONTENT_DIR, filename);

    if (data.published === true) {
      fs.copyFileSync(filePath, destPath);
      console.log(`✓ 公開: ${filename}`);
      return true;
    } else {
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
        console.log(`✗ 非公開化: ${filename}`);
        return true;
      }
    }
  } catch (err) {
    console.error(`エラー (${filename}):`, err.message);
  }
  return false;
}

// 全ファイルを一括同期
function fullSync() {
  console.log('\n📂 Obsidian → content/ 同期中...');
  if (!fs.existsSync(OBSIDIAN_DIR)) {
    console.error('❌ Obsidianフォルダが見つかりません:', OBSIDIAN_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(OBSIDIAN_DIR);
  let synced = 0;
  for (const file of files) {
    if (processFile(path.join(OBSIDIAN_DIR, file))) synced++;
  }
  console.log(`✅ 同期完了: ${synced}件の変更`);
  return synced;
}

// Gitにコミット＆プッシュ
function gitPush(message) {
  try {
    execSync('git add content/', { cwd: PROJECT_DIR });
    const status = execSync('git status --porcelain content/', { cwd: PROJECT_DIR }).toString().trim();
    if (!status) {
      console.log('📭 変更なし（pushスキップ）');
      return;
    }
    execSync(`git commit -m "${message}\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`, {
      cwd: PROJECT_DIR,
    });
    execSync('git push', { cwd: PROJECT_DIR });
    console.log('🚀 GitHubにpush完了 → サイトが自動更新されます（約1分）');
  } catch (err) {
    console.error('Git エラー:', err.message);
  }
}

// ── メイン処理 ──────────────────────────────

// 起動時にまず全件同期
const changed = fullSync();
gitPush('Sync published posts from Obsidian');

// --sync フラグがあれば監視せずに終了
if (SYNC_ONLY) {
  console.log('✅ 同期モードで実行しました。監視は行いません。');
  process.exit(0);
}

// debounce用タイマー
let pushTimer = null;
function schedulePush(message) {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => gitPush(message), 3000);
}

// ファイル監視開始
const watcher = chokidar.watch(OBSIDIAN_DIR, {
  ignored: /(^|[/\\])\../,   // ドットファイル無視
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 2000, // iCloudの同期が落ち着くまで2秒待つ
    pollInterval: 100,
  },
});

watcher
  .on('add', (filePath) => {
    processFile(filePath);
    schedulePush('Publish new post from Obsidian');
  })
  .on('change', (filePath) => {
    processFile(filePath);
    schedulePush('Update published posts from Obsidian');
  })
  .on('unlink', (filePath) => {
    const filename = path.basename(filePath);
    const destPath = path.join(CONTENT_DIR, filename);
    if (fs.existsSync(destPath)) {
      fs.unlinkSync(destPath);
      console.log(`🗑  削除: ${filename}`);
      schedulePush('Remove deleted post');
    }
  });

console.log('\n👀 Obsidianを監視中... (Ctrl+C で停止)\n');
