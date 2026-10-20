import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";

import { HeroSection } from "@/components/landing/HeroSection";
import { HeroPreviewTabs } from "@/components/landing/HeroPreviewTabs";
import { IngestionPipelineSection } from "@/components/landing/IngestionPipelineSection";
import { BentoFeaturesSection } from "@/components/landing/BentoFeaturesSection";
import { EcosystemSection } from "@/components/landing/EcosystemSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { CtaBannerSection } from "@/components/landing/CtaBannerSection";

import styles from "./HomePage.module.css";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);

const SAMPLE_REPOS = [
  { name: "CodeLens-AI", repo: "shenmareparas/CodeLens-AI", tag: ".NET 10" },
  { name: "Chess Flutter", repo: "shenmareparas/Chess", tag: "Flutter" },
  { name: "Play Store AI", repo: "shenmareparas/play-store-ai-review", tag: "Python" },
  { name: "Portfolio Next.js", repo: "shenmareparas/Portfolio_NextJS", tag: "Next.js" },
] as const;

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRepo, setSelectedRepo] = useState<string>("shenmareparas/CodeLens-AI");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP Animation Master Orchestrator
  useGSAP(
    () => {
      const mm = gsap.matchMedia(containerRef);

      mm.add(
        {
          isDesktop: "(min-width: 800px)",
          isMobile: "(max-width: 799px)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { reduceMotion } = context.conditions as {
            isDesktop: boolean;
            isMobile: boolean;
            reduceMotion: boolean;
          };

          // Accessibility: If user prefers reduced motion, set elements immediately visible
          if (reduceMotion) {
            gsap.set(
              ".landing-nav, .hero-headline, .hero-subtitle, .hero-samples, .hero-cta, .hero-stats, .preview-window, .pipeline-step-card, .bento-feature-card, .eco-card, .comp-table",
              {
                autoAlpha: 1,
                y: 0,
                scale: 1,
              }
            );
            return;
          }

          // Initial batch hidden state for ScrollTrigger elements
          gsap.set(".pipeline-step-card", { autoAlpha: 0, y: 35 });
          gsap.set(".bento-feature-card", { autoAlpha: 0, y: 35 });
          gsap.set(".eco-card", { autoAlpha: 0, y: 25 });

          // 1. Master Hero Entrance Timeline
          const heroTl = gsap.timeline({
            defaults: { ease: "power3.out" },
          });

          heroTl
            .from(".landing-nav", {
              autoAlpha: 0,
              y: -20,
              duration: 0.6,
              ease: "power2.out",
            })
            .from(
              ".hero-headline",
              {
                autoAlpha: 0,
                y: 35,
                duration: 0.8,
              },
              "-=0.2"
            )
            .from(
              ".hero-subtitle",
              {
                autoAlpha: 0,
                y: 20,
                duration: 0.65,
              },
              "-=0.5"
            )
            .from(
              ".hero-samples",
              {
                autoAlpha: 0,
                y: 15,
                duration: 0.55,
              },
              "-=0.4"
            )
            .from(
              ".hero-cta",
              {
                autoAlpha: 0,
                scale: 0.95,
                y: 15,
                duration: 0.55,
              },
              "-=0.4"
            )
            .from(
              ".hero-stats",
              {
                autoAlpha: 0,
                y: 25,
                duration: 0.75,
              },
              "-=0.3"
            );

          // 3. ScrollTrigger for Mock Preview Window
          gsap.from(".preview-window", {
            scrollTrigger: {
              trigger: ".preview-window",
              start: "top 85%",
              toggleActions: "play none none none",
            },
            autoAlpha: 0,
            y: 50,
            scale: 0.96,
            duration: 0.9,
            ease: "power3.out",
          });

          // 4. ScrollTrigger Batch for Pipeline Cards
          ScrollTrigger.batch(".pipeline-step-card", {
            onEnter: (batch) =>
              gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                stagger: 0.14,
                duration: 0.65,
                ease: "power2.out",
                overwrite: true,
              }),
            start: "top 82%",
          });

          // 5. ScrollTrigger Batch for Bento Feature Cards
          ScrollTrigger.batch(".bento-feature-card", {
            onEnter: (batch) =>
              gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                stagger: 0.12,
                duration: 0.65,
                ease: "power2.out",
                overwrite: true,
              }),
            start: "top 82%",
          });

          // 6. ScrollTrigger Batch for Ecosystem Cards
          ScrollTrigger.batch(".eco-card", {
            onEnter: (batch) =>
              gsap.to(batch, {
                autoAlpha: 1,
                y: 0,
                stagger: 0.08,
                duration: 0.5,
                ease: "power2.out",
                overwrite: true,
              }),
            start: "top 85%",
          });

          // 7. ScrollTrigger for Comparison Table (animates entire table together, not line-by-line)
          gsap.from(".comp-table", {
            scrollTrigger: {
              trigger: ".comp-table",
              start: "top 85%",
              toggleActions: "play none none none",
            },
            autoAlpha: 0,
            y: 25,
            duration: 0.65,
            ease: "power2.out",
          });

          // 8. CTA Section entrance
          gsap.from(".cta-title, .cta-subtitle, .cta-actions", {
            scrollTrigger: {
              trigger: ".cta-title",
              start: "top 85%",
              toggleActions: "play none none none",
            },
            autoAlpha: 0,
            y: 25,
            stagger: 0.15,
            duration: 0.7,
            ease: "power2.out",
          });
        }
      );

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  const handleNavScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
      window.history.pushState(null, "", `#${targetId}`);
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname === "/" || window.location.pathname === "") {
      e.preventDefault();
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReduced ? "auto" : "smooth",
      });
      window.history.pushState(null, "", "/");
    }
  };

  return (
    <div ref={containerRef} className={styles.landingContainer}>
      {/* Floating Navigation Bar */}
      <div className={`${styles.navWrapper} landing-nav`}>
        <header className={`${styles.nav} ${isScrolled ? styles.navScrolled : ""}`}>
          <Link to="/" className={styles.brandLink} onClick={handleLogoClick}>
            <div className={styles.brandLogo}>
              <BrandLogo size={20} />
            </div>
            <span className={styles.brandText}>CodeLens AI</span>
          </Link>

          <nav className={styles.navLinks} aria-label="Main Navigation">
            <a
              href="#preview"
              className={styles.navLink}
              onClick={(e) => handleNavScroll(e, "preview")}
            >
              Live Demo
            </a>
            <a
              href="#pipeline"
              className={styles.navLink}
              onClick={(e) => handleNavScroll(e, "pipeline")}
            >
              Architecture
            </a>
            <a
              href="#features"
              className={styles.navLink}
              onClick={(e) => handleNavScroll(e, "features")}
            >
              Capabilities
            </a>
            <a
              href="#ecosystem"
              className={styles.navLink}
              onClick={(e) => handleNavScroll(e, "ecosystem")}
            >
              Ecosystems
            </a>
            <a
              href="#comparison"
              className={styles.navLink}
              onClick={(e) => handleNavScroll(e, "comparison")}
            >
              Why CodeLens
            </a>
          </nav>

          <div className={styles.navActions}>
            <ThemeToggle />

            {isAuthenticated ? (
              <Link to="/dashboard" className={styles.loginBtn}>
                <span>Open Dashboard</span>
              </Link>
            ) : (
              <Link to="/auth/signin" className={styles.loginBtn}>
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </header>
      </div>

      {/* Main Content Sections */}
      <main>
        {/* 1. Hero Section */}
        <HeroSection isAuthenticated={isAuthenticated} />

        {/* 2. Interactive Mock Sandbox with sample repo selector directly on top */}
        <HeroPreviewTabs
          selectedRepo={selectedRepo}
          onSelectRepo={setSelectedRepo}
          sampleRepos={SAMPLE_REPOS}
        />

        {/* 3. Ingestion Pipeline Section */}
        <IngestionPipelineSection />

        {/* 4. Core Bento Capabilities */}
        <BentoFeaturesSection />

        {/* 5. Supported Ecosystems */}
        <EcosystemSection />

        {/* 6. Comparison Section */}
        <ComparisonSection />

        {/* 7. Bottom CTA Banner */}
        <CtaBannerSection isAuthenticated={isAuthenticated} />
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerCopy}>
            &copy; {new Date().getFullYear()} CodeLens AI. Built with .NET 10, React 19, and Google Gemini 3.8 Flash.
          </p>
          <div className={styles.footerLinks}>
            <Link to="/auth/signin" className={styles.footerLink}>
              Sign In
            </Link>
            <Link to="/dashboard" className={styles.footerLink}>
              Dashboard
            </Link>
            <a
              href="https://github.com/shenmareparas/CodeLens-AI"
              target="_blank"
              rel="noreferrer"
              className={styles.footerLink}
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
