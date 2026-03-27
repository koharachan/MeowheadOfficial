import { cn } from '@/lib/utils';

interface AnimatedGradientTextProps {
  text: string;
  className?: string;
}

export function AnimatedGradientText({ text, className }: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        'bg-[linear-gradient(90deg,rgba(34,211,238,1),rgba(59,130,246,1),rgba(168,85,247,1),rgba(34,211,238,1))] bg-[length:200%_100%] bg-clip-text text-transparent',
        'animate-[magic-gradient_6s_linear_infinite]',
        className
      )}
    >
      {text}
    </span>
  );
}
