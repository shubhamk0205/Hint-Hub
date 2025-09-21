import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  BookOpen, 
  Home, 
  Menu, 
  X
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import { signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const Navigation = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/code-space", label: "Code Space", icon: Code },
    { to: "/study-plans", label: "Study Plans", icon: BookOpen },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/5c8987ad-b71e-4082-acd9-e9cfda240e82.png" 
              alt="Hint Hub" 
              className="h-32 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              (label === "Home" || user) && (
                <Link key={to} to={to}>
                  <Button
                    variant={isActive(to) ? "default" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              )
            ))}
          </div>

          {/* Profile Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                  <AvatarFallback>{user.displayName ? user.displayName[0] : "U"}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block font-medium text-sm">{user.displayName || user.email}</span>
                <button
                  onClick={() => signOut(auth)}
                  className="ml-2 px-3 py-1 rounded bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/80 transition"
                >
                  Log out
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  const provider = new GoogleAuthProvider();
                  await signInWithPopup(auth, provider);
                }}
                className="px-4 py-1 rounded bg-primary text-primary-foreground text-s font-semibold shadow hover:bg-primary/90 transition"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-2 space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                (label === "Home" || user) && (
                  <Link key={to} to={to} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant={isActive(to) ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  </Link>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;