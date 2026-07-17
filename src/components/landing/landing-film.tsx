"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const scenes = [
  { id: "intro", label: "01 INTRODUCTION" },
  { id: "proof", label: "02 PROOF" },
  { id: "loop", label: "03 LOOP" },
  { id: "registry", label: "04 REGISTRY" },
];

const proofSteps = [
  ["01", "FRESH CHALLENGE", "random, short-lived, created at the door"],
  ["02", "WALLET SIGNATURE", "only the holding wallet can answer, EIP-712"],
  ["03", "LIVE CONTRACT STATE", "a fresh Monad read, never a cache"],
  ["04", "CHAIN-BOUND PROOF", "every QR bound to exactly one deployment"],
] as const;

const registryRows = [
  ["PROTOCOL", "UNISKY PASS REGISTRY"],
  ["NETWORK", "MONAD MAINNET · 143"],
  ["TESTNET", "MONAD · 10143"],
  ["PROOF", "EIP-712 · 60 SEC"],
  ["TRANSFER", "NONE"],
  ["CUSTODY", "NO APP-HELD FUNDS"],
  ["CONTRACT", "0x935D7681Fd0454f38848925fc03d918dA036Ed99"],
  ["STATUS", "LIVE"],
] as const;

export function LandingFilm() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderProgress, setLoaderProgress] = useState(0);
  const [activeScene, setActiveScene] = useState("intro");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      return undefined;
    }
    const progressTimer = window.setInterval(() => {
      setLoaderProgress((current) => Math.min(100, current + 8));
    }, 90);
    const timer = window.setTimeout(() => setLoaderVisible(false), reducedMotion ? 80 : 1_350);
    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(timer);
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let destroyAnimations: (() => void) | undefined;
    let disposed = false;
    const context = gsap.context(() => {
      const mm = gsap.matchMedia();
      const markScene = (id: string) => ({
        onEnter: () => setActiveScene(id),
        onEnterBack: () => setActiveScene(id),
      });

      if (!reducedMotion) {
        mm.add("(min-width: 768px)", () => {
          const intro = gsap.timeline({
            scrollTrigger: {
              trigger: ".landing-scene--intro",
              start: "top top",
              end: "+=170%",
              scrub: 0.9,
              pin: true,
              ...markScene("intro"),
            },
          });
          intro
            .to(".intro-wordmark__tail", { xPercent: 115, opacity: 0, ease: "none" }, 0.05)
            .to(".intro-meta", { y: -28, opacity: 1, stagger: 0.08, ease: "none" }, 0.12)
            .to(".intro-wordmark__u", { scale: 10, xPercent: 20, transformOrigin: "left center", ease: "none" }, 0.18)
            .to(".intro-counter", { opacity: 1, scale: 1.08, ease: "none" }, 0.36)
            .to(".intro-rail", { scaleY: 1, transformOrigin: "top center", ease: "none" }, 0.1);

          const proof = gsap.timeline({
            scrollTrigger: {
              trigger: ".landing-scene--proof",
              start: "top top",
              end: "+=135%",
              scrub: 0.8,
              pin: true,
              ...markScene("proof"),
            },
          });
          proof
            .fromTo(".proof-plane--one", { xPercent: -12, opacity: 0.2 }, { xPercent: 0, opacity: 1, ease: "none" }, 0)
            .fromTo(".proof-plane--two", { xPercent: 14, opacity: 0.2 }, { xPercent: 0, opacity: 1, ease: "none" }, 0.1)
            .to(".proof-stem", { scaleX: 1, ease: "none" }, 0.25)
            .to(".proof-statement", { yPercent: -16, ease: "none" }, 0.42)
            .to(".proof-coordinate", { xPercent: -32, ease: "none" }, 0.52);

          const sixty = gsap.timeline({
            scrollTrigger: {
              trigger: ".landing-scene--sixty",
              start: "top top",
              end: "+=175%",
              scrub: 0.9,
              pin: true,
              ...markScene("proof"),
            },
          });
          sixty
            .to(".sixty-count", { yPercent: -230, ease: "none" }, 0)
            .to(".sixty-count--secondary", { yPercent: -340, ease: "none" }, 0.05)
            .to(".sixty-step", { y: 0, opacity: 1, stagger: 0.12, ease: "none" }, 0.18)
            .to(".sixty-payload", { xPercent: -20, ease: "none" }, 0.2)
            .to(".sixty-zero", { scale: 12, transformOrigin: "center", ease: "none" }, 0.76);

          const loop = gsap.timeline({
            scrollTrigger: {
              trigger: ".landing-scene--loop",
              start: "top top",
              end: "+=170%",
              scrub: 1,
              pin: true,
              ...markScene("loop"),
            },
          });
          loop
            .to(".loop-screen--issue", { xPercent: -105, ease: "none" }, 0.1)
            .fromTo(".loop-screen--carry", { xPercent: 105 }, { xPercent: 0, ease: "none" }, 0.1)
            .to(".loop-screen--carry", { xPercent: -105, ease: "none" }, 0.48)
            .fromTo(".loop-screen--prove", { xPercent: 105 }, { xPercent: 0, ease: "none" }, 0.48)
            .to(".loop-viewfinder", { scale: 1, opacity: 1, ease: "none" }, 0.7);

          const registry = gsap.timeline({
            scrollTrigger: {
              trigger: ".landing-scene--registry",
              start: "top top",
              end: "+=145%",
              scrub: 0.9,
              pin: true,
              ...markScene("registry"),
            },
          });
          registry
            .fromTo(".registry-row", { y: 70, opacity: 0.25 }, { y: 0, opacity: 1, stagger: 0.08, ease: "none" }, 0)
            .to(".registry-u", { yPercent: -4, ease: "none" }, 0.25)
            .to(".registry-index", { xPercent: -16, ease: "none" }, 0.4)
            .to(".registry-rows", { yPercent: -35, ease: "none" }, 0.52)
            .to(".registry-summary", { opacity: 1, y: 0, ease: "none" }, 0.8);

          const climax = gsap.timeline({
            scrollTrigger: {
              trigger: ".landing-scene--climax",
              start: "top top",
              end: "+=115%",
              scrub: 1.1,
              pin: true,
              ...markScene("registry"),
            },
          });
          climax
            .fromTo(".climax-inner", { scale: 5.5 }, { scale: 1, ease: "none" }, 0)
            .to(".climax-copy", { letterSpacing: "-0.08em", ease: "none" }, 0.45)
            .to(".climax-mark", { yPercent: -22, opacity: 1, ease: "none" }, 0.7);

        });

        mm.add("(max-width: 767px)", () => {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: ".landing-scene--intro",
                start: "top 70%",
                end: "bottom 30%",
                scrub: 0.8,
                ...markScene("intro"),
              },
            })
            .to(".intro-wordmark__tail", { xPercent: 36, opacity: 0, ease: "none" }, 0)
            .to(".intro-wordmark__u", { scale: 2.2, transformOrigin: "left center", ease: "none" }, 0.15);

          ["proof", "sixty", "loop", "registry"].forEach((id) => {
            ScrollTrigger.create({
              trigger: `.landing-scene--${id}`,
              start: "top 60%",
              end: "bottom 40%",
              ...markScene(id === "sixty" ? "proof" : id),
            });
          });
        });

        const lenis = new Lenis({
          autoRaf: false,
          lerp: 0.08,
          smoothWheel: true,
          syncTouch: false,
        });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        document.fonts?.ready.then(() => {
          if (!disposed) ScrollTrigger.refresh();
        });

        destroyAnimations = () => {
          disposed = true;
          gsap.ticker.remove(tick);
          lenis.destroy();
          mm.revert();
        };
      }

      return undefined;
    }, root);

    return () => {
      destroyAnimations?.();
      context.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div ref={rootRef} className="landing-film" data-active-scene={activeScene}>
      <a className="landing-skip-link" href="#landing-enter">
        Skip film and enter the app
      </a>

      <div className={`landing-loader${loaderVisible ? " is-visible" : ""}`} aria-hidden={!loaderVisible}>
        <div className="landing-loader__top">
          <span>UNISKY / PASS</span>
          <span>MONAD · 143</span>
        </div>
        <div className="landing-loader__line"><span /></div>
        <p>INITIALIZING <span>{String(loaderProgress).padStart(3, "0")}%</span></p>
      </div>

      <nav className="landing-nav" aria-label="Landing navigation">
        <a className="landing-nav__brand" href="#scene-intro">UNISKY</a>
        <div className="landing-nav__scenes">
          {scenes.map((scene) => (
            <a key={scene.id} href={`#scene-${scene.id}`} aria-current={activeScene === scene.id ? "step" : undefined}>
              {scene.label}
            </a>
          ))}
        </div>
        <Link className="landing-nav__app" href="/passes">OPEN APP ↗</Link>
      </nav>

      <div className="landing-progress" aria-hidden="true">
        <span className="landing-progress__active" />
      </div>

      <section id="scene-intro" className="landing-scene landing-scene--intro" aria-labelledby="intro-title">
        <div className="landing-scene__inner intro-scene__inner">
          <div className="intro-topline">
            <span>INTRODUCING</span>
            <span className="mono-data">00 / 07</span>
          </div>
          <h1 id="intro-title" className="intro-wordmark" aria-label="Introducing Unisky">
            <span className="intro-wordmark__u">U</span><span className="intro-wordmark__tail">NISKY</span>
          </h1>
          <div className="intro-counter" aria-hidden="true"><span>U</span></div>
          <div className="intro-meta intro-meta--one">LIVE ON MONAD <span>·</span> 143 / 10143</div>
          <div className="intro-meta intro-meta--two">NO APP-HELD FUNDS</div>
          <div className="intro-meta intro-meta--three">NON-TRANSFERABLE</div>
          <div className="intro-copy">
            <p>MEMBERSHIP THAT PROVES ITSELF</p>
            <p>ONE WALLET FOR EVERY PLACE YOU BELONG</p>
          </div>
          <div className="intro-scroll">SCROLL TO ENTER <span>↓</span></div>
          <div className="intro-rail" aria-hidden="true" />
        </div>
      </section>

      <section id="scene-proof" className="landing-scene landing-scene--proof" aria-labelledby="proof-title">
        <div className="landing-scene__inner proof-scene__inner">
          <div className="proof-coordinate mono-data">0x8A1F…7C20 / 0x935D…ED99 / 10143</div>
          <div className="proof-stem" aria-hidden="true" />
          <div className="proof-plane proof-plane--one"><span>U</span></div>
          <div className="proof-plane proof-plane--two"><span>U</span></div>
          <div className="proof-statement">
            <p className="technical-label">01 / INSIDE THE U</p>
            <h2 id="proof-title">A SCREENSHOT<br />CAN LOOK RIGHT.</h2>
            <h3>A LIVE PROOF<br />HAS TO BE RIGHT.</h3>
          </div>
          <div className="proof-footer"><span>COUNTER AS GATE</span><span>LIVE STATE / NO CACHE</span></div>
        </div>
      </section>

      <section id="scene-sixty" className="landing-scene landing-scene--sixty" aria-labelledby="sixty-title">
        <div className="landing-scene__inner sixty-scene__inner">
          <div className="sixty-header"><span className="technical-label">02 / THE CHALLENGE</span><span className="mono-data">EIP-712 / CHAIN-BOUND</span></div>
          <div className="sixty-count-wrap" aria-label="A sixty second challenge countdown">
            <span className="sixty-count">60</span><span className="sixty-count--secondary">45<br />30<br />10</span><span className="sixty-zero">0</span>
          </div>
          <div className="sixty-title"><p className="technical-label">SIXTY SECONDS</p><h2 id="sixty-title">A fresh answer<br />at the door.</h2></div>
          <div className="sixty-steps">
            {proofSteps.map(([number, title, description]) => <div className="sixty-step" key={number}><span className="sixty-step__number">{number}</span><div><h3>{title}</h3><p>{description}</p></div></div>)}
          </div>
          <div className="sixty-payload mono-data">nonce: 0x4d3f…b18a&nbsp;&nbsp; expires: 60&nbsp;&nbsp; chainId: 143&nbsp;&nbsp; signer: holder</div>
        </div>
      </section>

      <section id="scene-loop" className="landing-scene landing-scene--loop" aria-labelledby="loop-title">
        <div className="landing-scene__inner loop-scene__inner">
          <div className="loop-screen loop-screen--issue"><p className="technical-label">01 / ISSUE</p><h2 id="loop-title">ONE WALLET<br />CREATES A PROGRAM<br />AND SENDS A PASS.</h2><span className="loop-index">01</span></div>
          <div className="loop-screen loop-screen--carry"><p className="technical-label">02 / CARRY</p><h2>EVERY MEMBERSHIP.<br />LIVE STATUS.<br />NO NEW PASSWORD.</h2><span className="loop-index">02</span></div>
          <div className="loop-screen loop-screen--prove"><p className="technical-label">03 / PROVE</p><h2>SIGN A FRESH<br />CHALLENGE.<br />NO TRANSACTION. NO GAS.</h2><span className="loop-index">03</span></div>
          <div className="loop-viewfinder" aria-hidden="true"><span /><span /><span /><span /></div>
        </div>
      </section>

      <section id="scene-registry" className="landing-scene landing-scene--registry" aria-labelledby="registry-title">
        <div className="landing-scene__inner registry-scene__inner">
          <div className="registry-u" aria-hidden="true">U</div>
          <div className="registry-index"><p className="technical-label">03 / REGISTRY INDEX</p><h2 id="registry-title">THE RECORD<br />IS THE RECEIPT.</h2><span className="mono-data">UNISKY / 001</span></div>
          <div className="registry-rows">
            {registryRows.map(([label, value]) => <div className="registry-row" key={label}><span className="technical-label">{label}</span><strong className={label === "CONTRACT" ? "mono-data" : undefined}>{value}</strong><i aria-hidden="true" /></div>)}
          </div>
          <div className="registry-summary mono-data">UNISKY PASS REGISTRY · MONAD 143 / 10143 · EIP-712 · 60 SEC · LIVE</div>
        </div>
      </section>

      <section id="scene-climax" className="landing-scene landing-scene--climax" aria-labelledby="climax-title">
        <div className="landing-scene__inner climax-scene__inner">
          <div className="climax-inner"><p className="technical-label">04 / VERIFIED STATE</p><h2 id="climax-title" className="climax-copy">NOT A SCREENSHOT.<br />A LIVE PROOF.</h2><span className="climax-mark">UNISKY PASS</span></div>
        </div>
      </section>

      <section id="landing-enter" className="landing-scene landing-scene--finale" aria-labelledby="finale-title">
        <div className="landing-scene__inner finale-scene__inner">
          <div className="finale-mark">UNISKY PASS</div>
          <p className="technical-label">THE APP / NOW OPEN</p>
          <h2 id="finale-title">Carry less.<br />Prove more.<br />Belong anywhere.</h2>
          <div className="finale-actions"><Link href="/passes" className="landing-cta landing-cta--primary">OPEN MY PASSES <span>→</span></Link><Link href="/issuer" className="landing-cta landing-cta--secondary">LAUNCH A PROGRAM <span>→</span></Link></div>
          <a className="finale-contract mono-data" href="https://monadscan.com/address/0x935D7681Fd0454f38848925fc03d918dA036Ed99" target="_blank" rel="noreferrer">0x935D7681Fd0454f38848925fc03d918dA036Ed99 ↗ <span>MONADSCAN</span></a>
          <div className="finale-u" aria-hidden="true">U</div>
        </div>
      </section>
    </div>
  );
}
