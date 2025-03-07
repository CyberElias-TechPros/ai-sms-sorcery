
import Layout from "@/components/Layout";
import MessageGenerator from "@/components/AIGenerator/MessageGenerator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Badge } from "@/components/ui-custom/Badge";
import { Link } from "react-router-dom";
import { 
  BrainCircuit, ArrowLeft, ArrowRight, 
  Lightbulb, HelpCircle, Save, History, MessageSquare
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Suggestion prompts for users
const suggestionPrompts = [
  "Create a promotional message for a 30% off flash sale",
  "Write a gentle reminder for an upcoming appointment",
  "Draft a shipping notification for an e-commerce order",
  "Compose a follow-up message for after a customer purchase",
  "Generate a welcome message for new subscribers to a service"
];

const AIGenerator = () => {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <ArrowLeft size={16} />
                </Button>
              </Link>
              <Badge variant="outline" size="sm">
                <BrainCircuit size={12} className="mr-1" />
                AI Tool
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AI Message Generator</h1>
            <p className="text-muted-foreground">
              Create messages powered by artificial intelligence for SMS and WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <History size={14} className="mr-1" />
              Message History
            </Button>
            <Button variant="outline" size="sm">
              <Save size={14} className="mr-1" />
              Save Templates
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="generator">Single Message</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Generation</TabsTrigger>
          </TabsList>
          <TabsContent value="generator" className="pt-4 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Generator */}
              <div className="lg:col-span-3">
                <MessageGenerator />
              </div>
              
              {/* Sidebar */}
              <div className="space-y-6">
                {/* Suggestions */}
                <Card variant="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Lightbulb size={16} className="mr-2 text-warning" />
                      Suggestions
                    </CardTitle>
                    <CardDescription>Try these prompts</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-2">
                      {suggestionPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          className="w-full p-2 text-xs text-left bg-secondary/50 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                {/* WhatsApp Tips */}
                <Card variant="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <MessageSquare size={16} className="mr-2 text-green-600" />
                      WhatsApp Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-3 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Include country code: </span>
                        Always include the country code (e.g., +1 for US).
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Manual confirmation: </span>
                        WhatsApp will open and require manual sending to prevent spam.
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Personalize: </span>
                        Personalized messages perform better and reduce spam flags.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Tips */}
                <Card variant="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <HelpCircle size={16} className="mr-2 text-primary" />
                      General Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-3 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium text-foreground">Be specific: </span>
                        Include details like target audience, tone, and purpose.
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Keep it brief: </span>
                        Messages work best when under 160 characters.
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Include a CTA: </span>
                        Add a clear call-to-action for better engagement.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="bulk" className="pt-4 animate-fade-in">
            <div className="flex items-center justify-center h-[400px] border rounded-lg border-dashed">
              <div className="text-center space-y-3 max-w-md p-6">
                <BrainCircuit size={40} className="mx-auto text-muted-foreground/60" />
                <h3 className="text-lg font-medium">Bulk Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Generate personalized messages for multiple contacts at once using AI. Coming soon.
                </p>
                <Button disabled>
                  <span>Coming Soon</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AIGenerator;
