"use client";

import { useState, ReactNode, useRef, useEffect } from "react";

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
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const activeTab = tabs.find((t) => t.id === activeId);

  useEffect(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector(
      `[data-tab-id="${activeId}"]`
    ) as HTMLElement | null;
    if (activeBtn) {
      const navRect = navRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - navRect.left,
        width: btnRect.width,
      });
    }
  }, [activeId]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-20">{activeTab?.content}</div>

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card/95 backdrop-blur-xl border-t border-border-primary safe-bottom">
        <nav
          ref={navRef}
          className="relative flex justify-around max-w-lg mx-auto"
        >
          {/* Animated indicator line */}
          <div
            className="absolute top-0 h-[2px] bg-jade rounded-full transition-all duration-300 ease-out"
            style={{
              left: indicatorStyle.left,
              width: indicatorStyle.width,
            }}
          />

          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => setActiveId(tab.id)}
                className={`
                  flex flex-col items-center gap-0.5 py-2.5 px-3 min-w-0 flex-1
                  text-[11px] font-medium transition-all duration-200
                  active:scale-95
                  ${
                    isActive
                      ? "text-jade"
                      : "text-text-muted hover:text-text-secondary"
                  }
                `}
              >
                {tab.icon && (
                  <span
                    className={`text-lg transition-transform duration-200 ${
                      isActive ? "scale-110" : ""
                    }`}
                  >
                    {tab.icon}
                  </span>
                )}
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
