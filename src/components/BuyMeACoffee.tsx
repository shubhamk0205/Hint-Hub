import { useEffect, useState } from 'react';

const BuyMeACoffee = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if the script is already loaded
    if (document.querySelector('script[data-name="BMC-Widget"]')) {
      setScriptLoaded(true);
      return;
    }

    // Create the script element
    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-id', 'ShubhamKapoor');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute('data-message', '');
    script.setAttribute('data-color', '#FF813F');
    script.setAttribute('data-position', 'Right');
    script.setAttribute('data-x_margin', '18');
    script.setAttribute('data-y_margin', '18');

    // Add event listeners for script loading
    script.onload = () => {
      console.log('Buy Me a Coffee script loaded successfully');
      setScriptLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Buy Me a Coffee script');
      setScriptLoaded(false);
    };

    // Append the script to the document head
    document.head.appendChild(script);

    // Cleanup function to remove the script when component unmounts
    return () => {
      const existingScript = document.querySelector('script[data-name="BMC-Widget"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // Fallback button if script doesn't load
  if (!scriptLoaded) {
    return (
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
      >
        <a
          href="https://www.buymeacoffee.com/ShubhamKapoor"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FF813F',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(255, 129, 63, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 129, 63, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 129, 63, 0.3)';
          }}
        >
          ☕ Buy me a coffee
        </a>
      </div>
    );
  }

  // This component doesn't render anything visible when script is loaded
  return null;
};

export default BuyMeACoffee;
