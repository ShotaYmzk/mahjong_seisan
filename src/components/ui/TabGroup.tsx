"use client";

import { useState, ReactNode } from "react";

export interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabGroupProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function TabGroup({ tabs, defaultTab }: TabGroupProps) {
  const [activeId, setActiveId] = useState(defaultTab ?? tabs[0]?.id);

  const activeTab = tabs.find((t) => t.id === activeId);

  return (
    <div className="flex flex-col h-full">
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {activeTab?.content}
      </div>

      {/* Bottom tab bar (mobile-first) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary border-t border-border-primary">
        <nav className="flex justify-around max-w-lg mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              className={`
                flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 flex-1
                text-xs font-medium transition-colors
                ${
                  tab.id === activeId
                    ? "text-jade"
                    : "text-text-muted hover:text-text-secondary"
                }
              `}
            >
              {tab.icon && <span className="text-lg">{tab.icon}</span>}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
