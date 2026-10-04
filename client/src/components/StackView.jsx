import React, { useState, useEffect } from 'react';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { apiHealth } from '../api/client';
import { RefreshCw, CheckCircle2, Shield, Code2, Server, Database, Key } from 'lucide-react';

export const StackView = ({ systemStatus, onRefreshStatus }) => {
  const [checking, setChecking] = useState(false);
  const [healthData, setHealthData] = useState(systemStatus);

  const fetchHealth = async () => {
    setChecking(true);
    try {
      const data = await apiHealth.check();
      setHealthData(data);
      if (onRefreshStatus) onRefreshStatus(data);
    } catch (err) {
      console.warn('Health check failed:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (systemStatus) {
      setHealthData(systemStatus);
    }
  }, [systemStatus]);

  const stackItems = [
    {
      name: 'React 18 + Vite',
      category: 'Frontend Client',
      desc: 'Blazing fast HMR dev server with component-driven architecture.',
      lang: 'JavaScript (ESM)',
      status: 'Active',
      icon: Code2,
    },
    {
      name: 'Tailwind CSS',
      category: 'Styling System',
      desc: 'Zero-border, white-first typography & tonal surfaces inspired by modern developer tools.',
      lang: 'CSS / Utility',
      status: 'Active',
      icon: Code2,
    },
    {
      name: 'Node.js & Express.js',
      category: 'Backend Server',
      desc: 'Lightweight RESTful API server with safe error handling and CORS support.',
      lang: 'JavaScript (ESM)',
      status: healthData ? 'Live' : 'Checking...',
      icon: Server,
    },
    {
      name: 'JWT & bcryptjs',
      category: 'Security & Auth',
      desc: 'Stateless access tokens (Bearer) with salted bcrypt password hashing.',
      lang: 'Crypto / Auth',
      status: 'Enforced',
      icon: Key,
    },
    {
      name: 'MongoDB & Mongoose',
      category: 'Database Layer',
      desc: 'Mongoose schemas with resilient offline fallback handling in development.',
      lang: 'NoSQL / ODM',
      status: healthData?.database === 'connected' ? 'Connected' : 'Offline / Standby',
      icon: Database,
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-950">
            Technology Stack & Health Diagnostics
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time status of the MERN architecture components.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchHealth}
          isLoading={checking}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Ping API Health</span>
        </Button>
      </div>

      {/* Health status banner */}
      <div className="bg-zinc-50/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white shadow-subtle flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-950">
                Express Server API
              </span>
              <Badge variant="success">Online</Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Listening on http://localhost:5000/api
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
          <div>
            <span className="text-zinc-400 block text-[10px]">DATABASE</span>
            <span className="font-medium text-zinc-800">
              {healthData?.database === 'connected' ? 'MongoDB Online' : 'Standby / Local'}
            </span>
          </div>
          <div>
            <span className="text-zinc-400 block text-[10px]">ENVIRONMENT</span>
            <span className="font-medium text-zinc-800">
              {healthData?.environment || 'development'}
            </span>
          </div>
        </div>
      </div>

      {/* Stack Items Grid - Zero Borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stackItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-zinc-50/80 p-5 rounded-2xl space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white shadow-subtle flex items-center justify-center text-zinc-700">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-950">
                      {item.name}
                    </h3>
                    <span className="text-[11px] text-zinc-400">
                      {item.category}
                    </span>
                  </div>
                </div>
                <Badge variant={item.status === 'Connected' || item.status === 'Active' || item.status === 'Enforced' || item.status === 'Live' ? 'neutral' : 'warning'}>
                  {item.status}
                </Badge>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed">
                {item.desc}
              </p>

              <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span>{item.lang}</span>
                <span>MERN Architecture</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StackView;
