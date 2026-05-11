import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArticleShell } from '@/components/article/ArticleShell';
import { loadPrivacyPolicy } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'Horae runs entirely on your iPhone. No accounts, no sync server, no analytics SDK. Read the full privacy policy.',
};

export default async function PrivacyPage() {
  const raw = await loadPrivacyPolicy();

  // The markdown file leads with an H1 ("# Privacy Policy — Horae") and an
  // italic "*Last updated: ...*" line. We render those ourselves in the
  // ArticleShell so the typography matches the design, and strip them from
  // the body before handing the rest to react-markdown.
  const stripped = raw
    .replace(/^#\s.*$/m, '') // first H1
    .replace(/^\*Last updated:[^*]*\*\s*/m, '') // italic last-updated line
    .trim();

  return (
    <>
      <Header active="privacy" />
      <ArticleShell
        eyebrow="Privacy Policy"
        title="Privacy"
        lead="The short version: Horae runs entirely on your iPhone. There is no server. There is no account. There is nothing to leak."
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{stripped}</ReactMarkdown>
      </ArticleShell>
      <Footer />
    </>
  );
}
