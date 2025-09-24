import { Mail, Phone, Linkedin, Instagram, Heart, Coffee } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">Shubham Kapoor</h3>
              <p className="text-muted-foreground mt-2">Do it for the impact</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Building innovative solutions and helping others learn through technology.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="/" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href="/study-plans" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Study Plans
                </a>
              </li>
              <li>
                <a 
                  href="/code-space" 
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Code Space
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Get in Touch</h4>
            <div className="space-y-3">
              <a 
                href="mailto:work.shubhamkapoor2005@gmail.com"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                work.shubhamkapoor2005@gmail.com
              </a>
              <a 
                href="https://wa.me/919588398192"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="h-4 w-4" />
                +91 9588398192
              </a>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-4 pt-2">
              <a 
                href="https://www.linkedin.com/in/shubham-kapoor-159545303/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </a>
              <a 
                href="https://www.instagram.com/shubham_kapoor_123/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {currentYear} Shubham Kapoor. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>and</span>
              <Coffee className="h-4 w-4 text-amber-600" />
              <span>by Shubham</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
