import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, X, Sparkles } from 'lucide-react';

const SupportWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSupport = () => {
    window.open('https://razorpay.me/@shubham4914', '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {!isExpanded ? (
        // Collapsed state - modern floating button
        <Button
          onClick={() => setIsExpanded(true)}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-orange-500 to-orange-600 hover:from-primary/90 hover:via-orange-600 hover:to-orange-700 shadow-2xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-110 border-2 border-white/20"
          size="icon"
        >
          <Heart className="h-7 w-7 text-white fill-current drop-shadow-lg" style={{
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.1))'
          }} />
        </Button>
      ) : (
        // Expanded state - modern card design
        <Card className="w-96 shadow-2xl border-0 bg-card backdrop-blur-xl">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg">
                  <Heart className="h-5 w-5 text-white fill-current" style={{
                    filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))'
                  }} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-card-foreground">Support Hint Hub</h3>
                  <p className="text-sm text-muted-foreground">Help us grow together</p>
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
            <div className="mb-6">
              <p className="text-card-foreground leading-relaxed mb-2">
                Love using Hint Hub? Your support helps us keep this platform free and continuously improve it for everyone!
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>You can enter any amount on the payment page</span>
              </div>
            </div>
            
            {/* Support Button */}
            <Button
              onClick={handleSupport}
              className="w-full bg-gradient-to-r from-primary via-orange-500 to-orange-600 hover:from-primary/90 hover:via-orange-600 hover:to-orange-700 text-primary-foreground font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl shadow-lg"
            >
              <div className="flex items-center justify-center gap-3">
                <Heart className="h-6 w-6 fill-current" style={{
                  filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 12px rgba(255, 255, 255, 0.1))'
                }} />
                <span className="text-lg">Support Hint Hub</span>
                <Sparkles className="h-5 w-5" style={{
                  filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))'
                }} />
              </div>
            </Button>
            
            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-border">
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
