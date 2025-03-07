
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageSquareDots, ArrowRight, BrainCircuit, Zap, BarChart3, Calendar } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navigation */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mr-2">
              <MessageSquareDots size={18} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">SMS Sorcery</h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</button>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-16 md:py-24 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center px-3 py-1 mb-6 border border-border rounded-full bg-background/50 backdrop-blur-sm">
              <span className="text-xs font-medium text-muted-foreground">AI-Powered SMS Platform</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-down">
              Transform your SMS with 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent ml-2">
                AI Magic
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-down animate-delay-100">
              Create personalized, engaging SMS messages with artificial intelligence. Connect your favorite SMS APIs and automate your messaging workflow.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-down animate-delay-200">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="bg-muted/30 py-16 md:py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to create, send, and analyze your SMS campaigns
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-card p-6 rounded-xl border shadow-subtle hover:shadow-elevated transition-all duration-300 animate-scale-in">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">AI-Powered Generation</h3>
              <p className="text-muted-foreground text-sm">
                Create engaging SMS messages using advanced AI models like GPT-4, Claude, and Gemini.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-card p-6 rounded-xl border shadow-subtle hover:shadow-elevated transition-all duration-300 animate-scale-in animate-delay-100">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Multiple API Integrations</h3>
              <p className="text-muted-foreground text-sm">
                Connect with Twilio, Termii, Infobip and other SMS providers through a single interface.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-card p-6 rounded-xl border shadow-subtle hover:shadow-elevated transition-all duration-300 animate-scale-in animate-delay-150">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Automated Scheduling</h3>
              <p className="text-muted-foreground text-sm">
                Schedule campaigns in advance and optimize send times for maximum engagement.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-card p-6 rounded-xl border shadow-subtle hover:shadow-elevated transition-all duration-300 animate-scale-in animate-delay-200">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Analytics & Insights</h3>
              <p className="text-muted-foreground text-sm">
                Track delivery rates, engagement metrics, and optimize your messaging strategy.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-card border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mr-2">
                <MessageSquareDots size={18} className="text-white" />
              </div>
              <span className="font-bold">SMS Sorcery</span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 mb-6 md:mb-0">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            </div>
            
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SMS Sorcery. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
