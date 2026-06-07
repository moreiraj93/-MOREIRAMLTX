import { Bot, Cpu, Brain, Zap, Globe, FileText } from 'lucide-react';
import SEOPage, { SEOPageData } from '@/components/features/SEOPage';

const data: SEOPageData = {
  metaTitle: 'AI Agent Platform 2025 — MockJ 4 | Autonomous AI Agents',
  heroTitle: 'The Most Capable',
  heroHighlight: 'AI Agent Platform',
  heroSub: 'Deploy autonomous AI agents that plan, execute, and complete multi-step tasks without constant supervision — all powered by MockJ 4.',
  heroCTA: 'Try AI Agents Free',
  keyword: 'AI Agent Platform',
  featureTitle: 'MockJ 4 AI Agent Capabilities',
  features: [
    { icon: Bot,      title: 'Autonomous Task Execution',  desc: 'Define a goal and MockJ\'s agent breaks it into steps, executes them in order, and reports back with results.' },
    { icon: Brain,    title: 'Long-Term Planning',         desc: 'Agents maintain context across multi-step tasks — remembering previous outputs and adapting plans.' },
    { icon: Globe,    title: 'Web Research',               desc: 'MockJ agents can synthesize information across topics, summarize findings, and compile reports.' },
    { icon: FileText, title: 'Document Processing',        desc: 'Upload batches of documents — agents extract, summarize, compare, and structure the data automatically.' },
    { icon: Cpu,      title: 'Code Execution Planning',    desc: 'MockJ plans full software implementations — breaking features into files, functions, and integration points.' },
    { icon: Zap,      title: 'Workflow Automation',        desc: 'Create repeatable AI workflows for tasks like daily digests, data analysis, and content pipelines.' },
  ],
  useCases: [
    { title: 'Competitive Research', desc: 'Ask MockJ to research competitors, analyze positioning, extract pricing, and compile a comparison report — fully automated.' },
    { title: 'Content Pipeline', desc: 'Set up a content agent: input topics, get outlines, drafts, image prompts, and social captions in one automated workflow.' },
    { title: 'Code Review Pipeline', desc: 'Submit code to MockJ\'s agent for automated review — security audit, performance analysis, and documentation check.' },
    { title: 'Lead Enrichment', desc: 'Paste a list of companies — MockJ researches each one, extracts key facts, and formats a structured enrichment report.' },
    { title: 'Knowledge Base Building', desc: 'Feed MockJ source material and let the agent extract, categorize, and organize knowledge entries into your ProjectBrain.' },
    { title: 'Report Generation', desc: 'Schedule weekly summary reports — MockJ compiles activity, trends, and action items from your notes and conversations.' },
  ],
  faqs: [
    { q: 'What is an AI agent?', a: 'An AI agent is an AI system that can autonomously plan and execute multi-step tasks toward a defined goal — breaking down complex requests, executing sub-tasks, and synthesizing results without step-by-step human guidance.' },
    { q: 'How does MockJ\'s project memory help agents?', a: 'ProjectBrain stores knowledge about your projects, team, and preferences. MockJ agents automatically reference this context when planning and executing tasks — no re-briefing required.' },
    { q: 'Can MockJ agents run in the background?', a: 'Currently MockJ agents run in foreground sessions. Background scheduling and webhook-triggered agents are on the MockJ 4 roadmap.' },
    { q: 'What tasks are agents best suited for?', a: 'Research, synthesis, content generation, code planning, document analysis, and any task that requires multiple sequential steps and decision points.' },
  ],
  comparison: {
    headers: ['MockJ 4', 'AutoGPT', 'LangChain', 'OpenAI Ass.'],
    rows: [
      { label: 'Voice Control',       values: [true,  false, false, false] },
      { label: 'Image Generation',    values: [true,  false, false, false] },
      { label: 'Project Memory',      values: [true,  false, false, true] },
      { label: 'No-Code Setup',       values: [true,  false, false, true] },
      { label: 'Free Tier',           values: ['Yes', 'OSS', 'OSS', 'Lim.'] },
      { label: 'Chat Interface',      values: [true,  false, false, true] },
    ],
  },
};

export default function AIAgentPlatformPage() {
  return <SEOPage data={data} />;
}
