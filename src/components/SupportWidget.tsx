import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CupSoda, Dumbbell, X, Sparkles } from 'lucide-react';

const SupportWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSupport = () => {
    window.open('https://razorpay.me/@shubham4914', '_blank');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      // noop
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's') {
        setIsExpanded(true);
      }
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {!isExpanded ? (
        // Collapsed state - modern floating button
        <Button
          onClick={() => setIsExpanded(true)}
          aria-label="Support Hint Hub - Buy a protein shake"
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-110 border border-border/60 ring-4 ring-primary/10"
          size="icon"
          title="Press S to open support"
        >
          <CupSoda className="h-20 w-20 text-primary-foreground drop-shadow-lg" style={{
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.1))'
          }} />
        </Button>
      ) : (
        // Expanded state - modern card design
        <Card className="w-96 shadow-2xl border border-border/60 bg-card/95 backdrop-blur-xl">
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg ring-2 ring-primary/20">
                  <CupSoda className="h-5 w-5 text-primary-foreground" style={{
                    filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))'
                  }} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-card-foreground">Fuel Hint Hub</h3>
                  <p className="text-sm text-muted-foreground">Buy me a protein shake</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="mb-5">
              <p className="text-card-foreground leading-relaxed mb-2">
                Enjoying Hint Hub? Your support keeps the project strong and helps me ship new features faster.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Dumbbell className="h-4 w-4" />
                <span>Choose any amount — one-time, fast, and secure</span>
              </div>
            </div>
            {/* Payment method badges */}
            <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground border border-border/60">UPI</span>
              <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground border border-border/60">Card</span>
              <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground border border-border/60">Netbanking</span>
            </div>
            {/* Quick amounts removed as per preference */}
            
            {/* Support Button */}
            <Button
              onClick={handleSupport}
              className="w-full bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-primary-foreground font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg ring-4 ring-primary/15"
            >
              <div className="flex items-center justify-center gap-3">
                <CupSoda className="h-6 w-6" style={{
                  filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.1))'
                }} />
                <span className="text-lg">Buy me a protein shake</span>
                <Sparkles className="h-5 w-5 text-primary-foreground" style={{
                  filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))'
                }} />
              </div>
            </Button>
            {/* Share */}
            <div className="mt-3 flex justify-center">
              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-2">
                {copied ? 'Link copied!' : 'Share Hint Hub'}
              </Button>
            </div>
            
            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-border/60">
              <p className="text-xs text-muted-foreground text-center">
                🔒 Secure payments powered by Razorpay
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupportWidget;

