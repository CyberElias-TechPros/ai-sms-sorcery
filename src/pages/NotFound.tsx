/**
 * 404 — a quiet corner of the void.
 */

import { Link } from "react-router-dom";
import { Button } from "@/components/ui-custom/Button";
import { WordCascade } from "@/lib/motion";
import { Sparkles } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[hsl(244_24%_5%)] text-[hsl(40_20%_95%)] overflow-hidden">
      <div className="aurora opacity-60" aria-hidden>
        <div className="aurora__blob aurora__blob--a" />
        <div className="aurora__blob aurora__blob--c" />
      </div>
      <div className="veil veil--grain bg-noise" aria-hidden />

      <div className="relative z-10 text-center px-6">
        <p className="font-display text-[8rem] leading-none font-light text-white/10 tabular">404</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4 -mt-8">
          <WordCascade text="This spell fizzled." />
        </h1>
        <p className="text-white/50 mb-8 max-w-md mx-auto">
          The page you reached for does not exist — or it has already vanished in a puff of smoke.
        </p>
        <Link to="/">
          <Button className="bg-white text-[hsl(244_24%_5%)] hover:bg-white/90 font-medium shadow-glow">
            <Sparkles size={15} className="mr-2" /> Return to the light
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
