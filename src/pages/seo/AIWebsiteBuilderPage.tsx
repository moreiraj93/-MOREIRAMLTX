import { Globe, Code2, Brain, Image, Zap, Cpu } from 'lucide-react';
import SEOPage, { SEOPageData } from '@/components/features/SEOPage';

const data: SEOPageData = {
  metaTitle: 'AI Website Builder 2025 — MockJ 4 | Build Websites with AI',
  heroTitle: 'The Fastest',
  heroHighlight: 'AI Website Builder',
  heroSub: 'Describe your site in plain English and MockJ 4 builds the structure, writes the copy, generates visuals, and gives you production-ready code.',
  heroCTA: 'Build a Website with AI Free',
  keyword: 'AI Website Builder',
  featureTitle: 'MockJ 4 Website Building Features',
  features: [
    { icon: Globe,  title: 'Full Site Scaffolding',    desc: 'Describe your business and MockJ generates a complete site structure — pages, sections, navigation, and CTA flows.' },
    { icon: Code2,  title: 'Production Code Output',   desc: 'Get clean React, HTML/CSS, or Tailwind code you can paste directly into your project.' },
    { icon: Brain,  title: 'Brand Memory',             desc: 'Tell MockJ your brand colors, voice, and audience once — it applies them consistently to every page it generates.' },
    { icon: Image,  title: 'AI Visual Generation',     desc: 'Generate hero images, product shots, and background textures that match your brand identity.' },
    { icon: Zap,    title: 'SEO Copy Writing',         desc: 'MockJ writes meta titles, descriptions, H1s, and body copy optimized for your target keywords.' },
    { icon: Cpu,    title: 'Iterative Refinement',     desc: 'Ask for changes in plain English — "make the hero bolder", "add a FAQ section" — and watch it update instantly.' },
  ],
  useCases: [
    { title: 'Startup Landing Pages', desc: 'Go from idea to live landing page in under an hour. Describe your product, get full copy + code, deploy to your host.' },
    { title: 'Portfolio Sites', desc: 'Describe your work and style. MockJ generates a personal portfolio structure with bio, case studies, and contact sections.' },
    { title: 'E-commerce Stores', desc: 'Build product pages, category layouts, and checkout flows. MockJ generates the UX structure and copy for each page.' },
    { title: 'SaaS Marketing Sites', desc: 'Create feature pages, pricing tables, testimonial sections, and FAQ pages with conversion-optimized copy.' },
    { title: 'Blog & Content Sites', desc: 'Generate blog templates, article layouts, and content structures with proper semantic HTML for SEO.' },
    { title: 'Agency Client Sites', desc: 'Rapidly prototype client websites — present mockups in minutes, then refine with client feedback in real-time.' },
  ],
  faqs: [
    { q: 'Does MockJ generate full websites automatically?', a: 'MockJ generates site structures, copy, and code — you guide the process conversationally, specifying pages, sections, and content requirements.' },
    { q: 'What frameworks does MockJ output code for?', a: 'MockJ can output code for React, Next.js, plain HTML/CSS, Tailwind CSS, Vue, and more — just specify your preference.' },
    { q: 'Can I generate images for my website with MockJ?', a: 'Yes — MockJ\'s integrated Image Studio lets you generate hero images, icons, and visual assets that match your brand and site style.' },
    { q: 'Does MockJ write SEO-optimized copy?', a: 'Yes — tell MockJ your target keywords and audience, and it writes meta tags, headings, and body copy structured for search engine ranking.' },
  ],
  comparison: {
    headers: ['MockJ 4', 'Template tools', 'Site builders', 'CMS tools'],
    rows: [
      { label: 'Code Output',          values: [true,  false, false, false] },
      { label: 'AI Image Generation',  values: [true,  false, false, false] },
      { label: 'Voice Control',        values: [true,  false, false, false] },
      { label: 'SEO Copy Writing',     values: [true,  false, false, false] },
      { label: 'No Subscription Lock', values: [true,  false, false, true] },
      { label: 'Free to Start',        values: ['Yes', 'Yes', 'Yes', 'Yes'] },
    ],
  },
};

export default function AIWebsiteBuilderPage() {
  return <SEOPage data={data} />;
}
