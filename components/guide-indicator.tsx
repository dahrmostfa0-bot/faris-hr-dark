'use client';

import { useGuide } from '@/lib/guide-context';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GuideIndicatorProps {
  text: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function GuideIndicator({ text, side = 'top', className }: GuideIndicatorProps) {
  const { guideEnabled } = useGuide();

  if (!guideEnabled) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className={cn(
              'group/guide relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all duration-300',
              'bg-accent/15 hover:bg-accent/30',
              className
            )}
            aria-label="دليل النظام"
          >
            <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-accent/50" style={{ animationDuration: '2s' }} />
            <span className="relative h-2 w-2 rounded-full bg-accent shadow-sm shadow-accent/50 transition-transform duration-200 group-hover/guide:scale-125" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align="center"
          className="max-w-[260px] border-accent/30 bg-gradient-to-br from-card to-accent/5 text-card-foreground shadow-lg"
        >
          <p className="text-xs leading-relaxed font-medium">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
