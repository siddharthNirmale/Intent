import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full mt-auto py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="h-px w-full bg-zinc-100 mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-600">Intent</span>
            <span className="text-zinc-300">•</span>
            <span>
              Created by{' '}
              <a
                href="https://siddharthn-portfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 hover:text-zinc-950 font-medium transition-colors cursor-pointer"
                title="Siddharth's Portfolio"
              >
                Siddharth
              </a>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://siddharthn-portfolio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-950 transition-colors inline-flex items-center gap-1 group cursor-pointer"
              title="Visit portfolio"
            >
              <span>Portfolio</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
            </a>
            <a
              href="https://github.com/siddharthNirmale/Intent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-950 transition-colors inline-flex items-center gap-1 group cursor-pointer"
              title="View on GitHub"
            >
              <span>GitHub</span>
              <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
