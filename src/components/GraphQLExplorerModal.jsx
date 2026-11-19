import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, Copy, Check, Code, Sparkles, Terminal, 
  Clock, Database, ArrowRight, BookOpen
} from 'lucide-react';
import { modalEntrance } from '../utils/animations';

const PRESET_QUERIES = [
  {
    name: 'All Public Books',
    query: `query GetAllBooks {
  books(limit: 6) {
    id
    title
    author
    category
    averageRating
    views
  }
}`
  },
  {
    name: 'Library Executive Stats',
    query: `query GetLibraryStats {
  stats {
    totalBooks
    publicBooksCount
    totalViews
    averageSystemRating
  }
}`
  },
  {
    name: 'Philosophy Books Only',
    query: `query GetPhilosophyBooks {
  books(category: "Philosophy", limit: 4) {
    id
    title
    author
    averageRating
    uploadedBy {
      username
      role
    }
  }
}`
  }
];

export default function GraphQLExplorerModal({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
  const [queryText, setQueryText] = useState(PRESET_QUERIES[0].query);
  const [responseJson, setResponseJson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // GSAP Entrance
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalEntrance(modalRef.current);
      // Auto-run first query on open for instant delight
      if (!responseJson) {
        handleExecuteQuery(PRESET_QUERIES[0].query);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (idx) => {
    setActiveQueryIndex(idx);
    setQueryText(PRESET_QUERIES[idx].query);
    handleExecuteQuery(PRESET_QUERIES[idx].query);
  };

  const handleExecuteQuery = async (customQuery) => {
    const q = customQuery || queryText;
    if (!q.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    const startTime = performance.now();

    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query: q })
      });

      const data = await response.json();
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      setResponseJson(data);

      if (data.errors && data.errors.length > 0) {
        setErrorMessage(data.errors[0].message || 'GraphQL Query returned errors');
      }
    } catch (err) {
      console.error('GraphQL fetch error:', err);
      setErrorMessage(err.message || 'Network error executing GraphQL query.');
      setResponseJson(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseJson) return;
    navigator.clipboard.writeText(JSON.stringify(responseJson, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        ref={modalRef}
        className="relative w-full max-w-4xl bg-[#181818] border border-[#2e2e2e] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#181818] border-b border-[#292929]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#C8A96A]/15 text-[#C8A96A]">
              <Code size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#F7F4EB]">
                  GraphQL API Explorer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/30">
                  /graphql endpoint
                </span>
              </div>
              <p className="text-[11px] text-[#A0A0A0]">
                Interactive GraphQL schema query tester & zero-config resolver
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#333] text-[#A0A0A0] hover:text-[#F7F4EB] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preset Selector Buttons */}
        <div className="px-6 py-3 bg-[#1e1e1e] border-b border-[#292929] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#777] mr-1">
              Sample Queries:
            </span>
            {PRESET_QUERIES.map((p, idx) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectPreset(idx)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeQueryIndex === idx
                    ? 'bg-[#C8A96A] text-black shadow-sm'
                    : 'bg-[#282828] text-[#A0A0A0] hover:text-[#F7F4EB] hover:bg-[#333]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleExecuteQuery()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#C8A96A] to-[#B59659] hover:brightness-110 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <Play size={13} className={isLoading ? 'animate-spin' : 'fill-white'} />
            <span>{isLoading ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>

        {/* Editor & Response Two-Column Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Query Editor */}
          <div className="w-full md:w-1/2 p-4 border-b md:border-b-0 md:border-r border-[#292929] flex flex-col bg-[#141414]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px] font-mono text-[#888]">
              <span className="flex items-center gap-1.5">
                <Terminal size={12} className="text-[#C8A96A]" />
                <span>GraphQL Query Document</span>
              </span>
              <span>Schema Syntax</span>
            </div>

            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="flex-1 w-full bg-[#181818] border border-[#2d2d2d] rounded-2xl p-3.5 text-xs font-mono text-[#F7F4EB] focus:outline-none focus:border-[#C8A96A] resize-none leading-relaxed selection:bg-[#C8A96A] selection:text-black"
              rows={12}
              spellCheck={false}
            />

            {errorMessage && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Right Column: JSON Response Viewer */}
          <div className="w-full md:w-1/2 p-4 flex flex-col bg-[#161616]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px] font-mono text-[#888]">
              <div className="flex items-center gap-2">
                <span>JSON Response</span>
                {executionTime !== null && (
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ⚡ {executionTime}ms
                  </span>
                )}
              </div>

              {responseJson && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-[#A0A0A0] hover:text-[#C8A96A] cursor-pointer"
                >
                  {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-[#121212] border border-[#2d2d2d] p-3.5">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-xs text-[#777] gap-2">
                  <div className="w-4 h-4 border-2 border-[#C8A96A] border-t-transparent rounded-full animate-spin" />
                  <span>Fetching GraphQL resolvers...</span>
                </div>
              ) : responseJson ? (
                <pre className="text-xs font-mono text-emerald-300 whitespace-pre leading-relaxed">
                  {JSON.stringify(responseJson, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#666]">
                  Click "Run Query" to execute the GraphQL resolver.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
