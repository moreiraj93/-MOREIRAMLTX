import { Image, Cpu, Zap, Brain, Globe, FileText } from 'lucide-react';
import SEOPage, { SEOPageData } from '@/components/features/SEOPage';

const data: SEOPageData = {
  metaTitle: 'AI Image Generator 2025 — MockJ 4 | Create Stunning AI Art',
  heroTitle: 'The Most Powerful',
  heroHighlight: 'AI Image Generator',
  heroSub: 'Create professional AI images, edit with image-to-image tools, maintain character consistency, and export with commercial licensing — all in MockJ 4.',
  heroCTA: 'Generate Images Free',
  keyword: 'AI Image Generator',
  featureTitle: 'MockJ 4 Image Studio Features',
  features: [
    { icon: Image,    title: 'Text-to-Image',          desc: 'Describe any scene and MockJ generates a high-quality image in seconds using the latest AI models.' },
    { icon: Cpu,      title: 'Image-to-Image',         desc: 'Upload a reference image and transform it with prompts — style transfer, variations, and creative edits.' },
    { icon: Brain,    title: 'Character Consistency',  desc: 'Keep your characters consistent across generations with our consistency preservation system.' },
    { icon: Zap,      title: '8 Style Presets',        desc: 'Realistic, Anime, Cyberpunk, Oil Paint, Watercolor, 3D Render, Sketch, and more — one click to apply.' },
    { icon: Globe,    title: 'Commercial License',     desc: 'Pro users get full commercial licensing rights to all generated images.' },
    { icon: FileText, title: 'Private Workspace',      desc: 'Enable Private Workspace mode to keep your generations confidential and off shared servers.' },
  ],
  useCases: [
    { title: 'Product Mockups', desc: 'Generate photorealistic product images for e-commerce listings, ads, and landing pages without a photo studio.' },
    { title: 'Social Media Content', desc: 'Create on-brand visual content for Instagram, Twitter, and LinkedIn at scale — consistent style, unlimited variations.' },
    { title: 'Game Assets', desc: 'Generate characters, environments, and props for indie games. Use Character Consistency to keep your heroes looking the same across scenes.' },
    { title: 'Marketing Campaigns', desc: 'Create campaign visuals, ad creatives, and banner images with brand-consistent styling and commercial use rights.' },
    { title: 'Book Covers & Illustrations', desc: 'Generate and iterate on book covers, chapter illustrations, and promotional artwork — export at high resolution.' },
    { title: 'Interior Design Concepts', desc: 'Visualize room layouts, furniture combinations, and décor styles before committing to expensive purchases.' },
  ],
  faqs: [
    { q: 'What powers MockJ image generation?', a: 'MockJ image generation runs as an MLTXPRO-owned Image Studio experience, delivering high-quality results at 1K, 2K, and 4K resolutions.' },
    { q: 'Can I use generated images for commercial purposes?', a: 'Yes — MockJ Pro includes commercial licensing for all generated images. Free tier images are for personal use only.' },
    { q: 'What is image-to-image generation?', a: 'Image-to-image lets you upload a reference photo and transform it with prompts — changing style, adding elements, or creating variations while preserving the original composition.' },
    { q: 'How does Character Consistency work?', a: 'Character Consistency mode analyzes your reference image and maintains key facial features, body proportions, and visual style across multiple generations — ideal for sequential artwork.' },
  ],
  comparison: {
    headers: ['MockJ 4', 'Basic tools', 'Prompt apps', 'Legacy flows'],
    rows: [
      { label: 'Image-to-Image',      values: [true,  false, true,  true] },
      { label: 'Voice Control',       values: [true,  false, false, false] },
      { label: 'Chat Interface',      values: [true,  true,  false, false] },
      { label: 'Commercial License',  values: [true,  true,  false, true] },
      { label: 'Project Memory',      values: [true,  false, false, false] },
      { label: 'Free Tier',           values: ['Yes', 'Lim.', 'No', 'Yes'] },
    ],
  },
};

export default function AIImageGeneratorPage() {
  return <SEOPage data={data} />;
}
