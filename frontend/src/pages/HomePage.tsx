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
  {
    name: "Play Store AI",
    repo: "shenmareparas/play-store-ai-review",
    tag: "Python",
  },
  {
    name: "Portfolio Next.js",
    repo: "shenmareparas/Portfolio_NextJS",
    tag: "Next.js",
  },
] as const;

const NAV_ITEMS = [
  { id: "preview", label: "Live Demo" },
  { id: "pipeline", label: "Architecture" },
  { id: "features", label: "Capabilities" },
  { id: "ecosystem", label: "Ecosystems" },
  { id: "comparison", label: "Why CodeLens" },
] as const;

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRepo, setSelectedRepo] = useState<string>(
    "shenmareparas/CodeLens-AI",
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const isClickScrollingRef = useRef(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let ticking = false;

    const updateScrollState = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      setShowScrollTop(scrollY > 400);

      // If user recently clicked a nav link and smooth scrolling is underway, keep clicked link active
      if (isClickScrollingRef.current) return;

      const focalPoint = 160;
      const sectionElements = NAV_ITEMS.map((item) =>
        document.getElementById(item.id),
      );

      const firstRect = sectionElements[0]?.getBoundingClientRect();
      // If above the first section (in Hero area), no nav item is active
      if (!firstRect || firstRect.top > focalPoint) {
        setActiveSection("");
        return;
      }

      let currentSection = "";

      for (let i = 0; i < NAV_ITEMS.length; i++) {
        const el = sectionElements[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();

        // If this section's top hasn't reached the focal line yet, skip
        if (rect.top > focalPoint) {
          continue;
        }

        const nextEl = sectionElements[i + 1];
        if (nextEl) {
          const nextRect = nextEl.getBoundingClientRect();
          // Active if this section has reached focalPoint and next section hasn't reached it yet
          if (nextRect.top > focalPoint) {
            currentSection = NAV_ITEMS[i].id;
            break;
          }
        } else {
          // Last section ("comparison"): active while its bottom is still below the focal line
          if (rect.bottom > focalPoint) {
            currentSection = NAV_ITEMS[i].id;
          }
        }
      }

      setActiveSection(currentSection);
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollState();
          ticking = false;
        });
        ticking = true;
      }
    };

    const handleUserInteraction = () => {
      if (isClickScrollingRef.current) {
        isClickScrollingRef.current = false;
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
        handleScroll();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    window.addEventListener("wheel", handleUserInteraction, { passive: true });
    window.addEventListener("touchmove", handleUserInteraction, {
      passive: true,
    });

    updateScrollState();
    const initTimer = setTimeout(updateScrollState, 150);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("wheel", handleUserInteraction);
      window.removeEventListener("touchmove", handleUserInteraction);
      clearTimeout(initTimer);
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
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
              },
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
              "-=0.2",
            )
            .from(
              ".hero-subtitle",
              {
                autoAlpha: 0,
                y: 20,
                duration: 0.65,
              },
              "-=0.5",
            )
            .from(
              ".hero-samples",
              {
                autoAlpha: 0,
                y: 15,
                duration: 0.55,
              },
              "-=0.4",
            )
            .from(
              ".hero-cta",
              {
                autoAlpha: 0,
                scale: 0.95,
                y: 15,
                duration: 0.55,
              },
              "-=0.4",
            )
            .from(
              ".hero-stats",
              {
                autoAlpha: 0,
                y: 25,
                duration: 0.75,
              },
              "-=0.3",
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
        },
      );

      return () => mm.revert();
    },
    { scope: containerRef },
  );

  const handleNavScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string,
  ) => {
    e.preventDefault();
    setActiveSection(targetId);
    isClickScrollingRef.current = true;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 850);

    const element = document.getElementById(targetId);
    if (element) {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
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
      setActiveSection("");
      isClickScrollingRef.current = true;
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => {
        isClickScrollingRef.current = false;
      }, 850);

      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({
        top: 0,
        behavior: prefersReduced ? "auto" : "smooth",
      });
      window.history.pushState(null, "", "/");
    }
  };

  const handleScrollToTop = () => {
    setActiveSection("");
    isClickScrollingRef.current = true;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 850);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReduced ? "auto" : "smooth",
    });
    window.history.pushState(null, "", window.location.pathname);
  };

  return (
    <div ref={containerRef} className={styles.landingContainer}>
      {/* Floating Navigation Bar */}
      <div className={`${styles.navWrapper} landing-nav`}>
        <header
          className={`${styles.nav} ${isScrolled ? styles.navScrolled : ""}`}
        >
          <Link to="/" className={styles.brandLink} onClick={handleLogoClick}>
            <div className={styles.brandLogo}>
              <BrandLogo size={20} />
            </div>
            <span className={styles.brandText}>CodeLens AI</span>
          </Link>

          <nav className={styles.navLinks} aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                  onClick={(e) => handleNavScroll(e, item.id)}
                  aria-current={isActive ? "true" : undefined}
                >
                  {item.label}
                </a>
              );
            })}
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
            &copy; {new Date().getFullYear()} CodeLens AI. Built with .NET 10,
            React 19, and Google Gemini 3.8 Flash.
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

      {/* Mobile-Only Move to Top Floating Action Button */}
      <button
        type="button"
        onClick={handleScrollToTop}
        className={`${styles.scrollToTopBtn} ${showScrollTop ? styles.scrollToTopVisible : ""}`}
        aria-label="Move to top of page"
        title="Move to top"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </div>
  );
}

export default HomePage;
