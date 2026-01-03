import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg hidden sm:inline">HealthCare Feedback</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/feedback">Give Feedback</Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" asChild>
              <Link to="/admin">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          )}
          {user ? (
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button asChild>
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border p-4 space-y-2 bg-card">
          <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
            <Link to="/feedback">Give Feedback</Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link to="/admin">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          )}
          {user ? (
            <Button variant="outline" className="w-full justify-start" onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button className="w-full justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </nav>
      )}
    </header>
  );
}
