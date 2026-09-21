/**
 * Auth — cinematic gate to the studio.
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AuthForm from "@/components/Auth/AuthForm";
import { useAuth } from "@/providers/AuthProvider";
import { Magnetic, ParallaxLayer, WordCascade } from "@/lib/motion";
import { Sparkles } from "lucide-react";

const Auth = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  useEffect(() => {
    if (!loading && isAuthenticated) navigate(returnUrl);
  }, [isAuthenticated, loading, navigate, returnUrl]);

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[hsl(244_24%_5%)] overflow-hidden">
      <div className="aurora" aria-hidden>
        <div className="aurora__blob aurora__blob--a" />
        <div className="aurora__blob aurora__blob--b" />
        <div className="aurora__blob aurora__blob--c" />
      </div>
      <div className="veil veil--grain bg-noise" aria-hidden />
      <div className="veil veil--vignette" aria-hidden />

      {/* editorial side copy */}
      <ParallaxLayer depth={10} className="hidden xl:block absolute left-[8%] top-1/2 -translate-y-1/2 max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-8 text-[hsl(40_20%_95%)]">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-[hsl(262_83%_62%)] to-[hsl(322_76%_62%)] flex items-center justify-center shadow-glow">
            <Sparkles size={17} className="text-white" />
          </span>
          <span className="font-display font-semibold text-lg">Sorcery</span>
        </Link>
        <h2 className="font-display text-4xl font-semibold leading-tight text-[hsl(40_20%_95%)] mb-4">
          <WordCascade text="Your words are" /> <span className="text-gradient italic"><WordCascade text="waiting to travel." startDelay={300} /></span>
        </h2>
        <p className="text-white/50 leading-relaxed">
          Five hundred messages on the house. The Sorcery engine and sandbox delivery are already lit —
          add your provider keys whenever you are ready.
        </p>
      </ParallaxLayer>

      <Magnetic strength={0.06} className="relative z-10 w-full max-w-md">
        <AuthForm />
      </Magnetic>

      <p className="absolute bottom-6 inset-x-0 text-center text-xs text-white/30">
        <Link to="/" className="link-draw hover:text-white/60 transition-colors">← Back to the light</Link>
      </p>
    </div>
  );
};

export default Auth;
