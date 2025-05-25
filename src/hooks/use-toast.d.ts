declare module '@/hooks/use-toast' {
    export function toast(options: { title: string; description: string; variant: string; duration?: number }): void;
} 