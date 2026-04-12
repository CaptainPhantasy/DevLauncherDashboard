import {
  Globe, Zap, Terminal, Box, Server, Monitor, Layers, Database, Package
} from 'lucide-react';

export const TYPE_ORDER = [
  'nextjs', 'vite', 'cra', 'remix', 'nuxt', 'angular',
  'express', 'fastify', 'django', 'flask', 'fastapi',
  'python', 'python-cli', 'docker', 'static', 'cli', 'custom',
];

export const TYPE_LABELS = {
  nextjs: 'Next.js', vite: 'Vite', cra: 'CRA', remix: 'Remix', nuxt: 'Nuxt', angular: 'Angular',
  express: 'Express', fastify: 'Fastify', django: 'Django', flask: 'Flask', fastapi: 'FastAPI',
  python: 'Python', 'python-cli': 'CLI', docker: 'Docker', static: 'Static', cli: 'CLI', custom: 'Custom',
};

export const TYPE_ICONS = {
  nextjs: Globe, vite: Zap, cra: Globe, remix: Globe, nuxt: Globe, angular: Globe,
  python: Terminal, 'python-cli': Terminal, fastapi: Terminal, django: Terminal, flask: Terminal,
  docker: Box, static: Globe, cli: Terminal, custom: Box, express: Server, fastify: Server,
};

export const TYPE_COLORS = {
  nextjs: 'bg-slate-600/30 text-slate-300',
  vite: 'bg-violet-600/20 text-violet-300',
  cra: 'bg-cyan-600/20 text-cyan-300',
  python: 'bg-yellow-600/20 text-yellow-300',
  fastapi: 'bg-yellow-600/20 text-yellow-300',
  django: 'bg-emerald-600/20 text-emerald-300',
  docker: 'bg-blue-600/20 text-blue-300',
  express: 'bg-green-600/20 text-green-300',
  fastify: 'bg-green-600/20 text-green-300',
};

export const ROLE_ICONS = {
  frontend: Monitor, backend: Server, middleware: Layers, database: Database, fullstack: Package,
};

export const ROLE_COLORS = {
  frontend: 'text-blue-400 bg-blue-400/10',
  backend: 'text-green-400 bg-green-400/10',
  middleware: 'text-yellow-400 bg-yellow-400/10',
  database: 'text-purple-400 bg-purple-400/10',
  fullstack: 'text-cyan-400 bg-cyan-400/10',
};
