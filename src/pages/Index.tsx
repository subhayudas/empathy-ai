import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, BarChart3, Shield, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Feedback Collection</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Your Voice Matters in Healthcare
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Share your healthcare experience through natural conversation. Our AI assistant 
              listens, understands, and helps improve the care you receive.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/feedback")} className="text-lg px-8">
                <MessageSquare className="h-5 w-5 mr-2" />
                Start Feedback
              </Button>
              {!user && (
                <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="text-lg px-8">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-card border-y border-border py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12">
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center p-6">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Natural Conversation</h3>
                <p className="text-muted-foreground">
                  Share your experience through voice or text. No forms, just a friendly chat.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Understanding</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes your feedback to capture what matters most to you.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Real Improvement</h3>
                <p className="text-muted-foreground">
                  Your insights drive meaningful changes in healthcare services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Your Privacy Matters</span>
            </div>
            <p className="text-muted-foreground">
              All feedback is handled securely and confidentially. We use your insights 
              to improve care quality while protecting your personal information.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} HealthCare Feedback System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
