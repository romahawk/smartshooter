// src/pages/Help.jsx
import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles, Keyboard, Bug, PlayCircle, Info, ChevronDown, ChevronRight,
  HelpCircle, BookOpen, Target, MousePointerClick, Trophy
} from "lucide-react";

/* ---------------- Utilities ---------------- */
function useScrollToHash() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("ring-2", "ring-orange-400/60", "rounded-md");
      const t = setTimeout(
        () => el.classList.remove("ring-2", "ring-orange-400/60", "rounded-md"),
        1200
      );
      return () => clearTimeout(t);
    }
  }, [hash]);
}

function fireOnboardingStart() {
  window.dispatchEvent(new CustomEvent("smarthooper:onboarding:start"));
}
function fireSeed() {
  window.dispatchEvent(new CustomEvent("smarthooper:onboarding:seed"));
}

/* ---------------- Local primitives ---------------- */
function Surface({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-2xl border shadow-sm",
        "border-black/10 dark:border-white/10",
        "bg-white dark:bg-neutral-800/90",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function ActionTile({ icon: Icon, title, subtitle, onClick, to, href }) {
  const content = (
    <div
      className={[
        "w-full text-left p-4 rounded-2xl transition-colors",
        "bg-orange-50 hover:bg-orange-100 active:bg-orange-200",
        "dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:active:bg-neutral-700/80",
        "border border-black/10 dark:border-white/10",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-orange-600 dark:text-orange-300 mt-0.5" />
        <div>
          <div className="text-[15px] font-semibold text-slate-900 dark:text-neutral-100">
            {title}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-600 dark:text-neutral-300 mt-0.5">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (onClick) return <button onClick={onClick} className="w-full text-left">{content}</button>;
  if (to)     return <Link to={to} className="block">{content}</Link>;
  if (href)   return <a href={href} className="block" rel="noopener noreferrer">{content}</a>;
  return content;
}

function Section({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-orange-600 dark:text-orange-300" />
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      <Surface className="p-4 md:p-5">{children}</Surface>
    </section>
  );
}

function Accordion({ items }) {
  return (
    <div className="divide-y divide-black/10 dark:divide-white/10">
      {items.map((it, i) => <AccordionItem key={i} {...it} />)}
    </div>
  );
}
function AccordionItem({ title, children, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="py-1.5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-slate-900 dark:text-neutral-100">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 opacity-70 dark:text-neutral-300" />
              : <ChevronRight className="h-4 w-4 opacity-70 dark:text-neutral-300" />}
      </button>
      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="text-[15px] leading-6 text-slate-700 dark:text-neutral-200 pb-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

function KbdRow({ keys, label }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-800">
      <div className="text-[15px] text-slate-800 dark:text-neutral-100">{label}</div>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd key={i} className="px-1.5 py-0.5 border rounded bg-white dark:bg-neutral-700 text-xs text-slate-800 dark:text-neutral-100">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
function SideLink({ to, label }) {
  return (
    <Link to={to} className="flex items-center gap-2 text-slate-700 dark:text-neutral-200 hover:text-orange-700 dark:hover:text-orange-300">
      <ChevronRight className="h-4 w-4 opacity-70" />
      {label}
    </Link>
  );
}

/* ---------------- Page ---------------- */
export default function Help() {
  useScrollToHash();

  return (
    <div className="px-3 md:px-6 py-4 md:py-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="mb-5 md:mb-7">
        <div className="flex items-start justify-between gap-3 opacity-100">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold flex items-center gap-2 text-slate-900">
              <HelpCircle className="h-6 w-6 text-orange-600 dark:text-orange-300" />
              Help & Tips
            </h1>
            <p className="text-[15px] leading-6 text-slate-600 mt-1">
              Quick actions and answers to get you shooting (and charting) faster.
            </p>
          </div>

          {/* BACK TO DASHBOARD */}
          <Link
            to="/dashboard"
            className="hidden md:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm
                       border border-black/10 dark:border-white/15
                       bg-transparent hover:bg-gray-50
                       dark:bg-neutral-800/80 dark:hover:bg-neutral-700
                       text-slate-700 dark:text-white"
          >
            <MousePointerClick className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-4 md:gap-6">
        {/* Main column */}
        <div className="space-y-6">
          <Surface className="p-4 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <ActionTile icon={Sparkles}  title="Start onboarding"  subtitle="Reopen the 3-step guide (⇧ + O)" onClick={fireOnboardingStart}/>
              <ActionTile icon={PlayCircle} title="Load sample data" subtitle="Add demo sessions to explore charts" onClick={fireSeed}/>
              <ActionTile icon={Bug}       title="Report a bug / request" subtitle="Opens your email client" href="mailto:support@example.com?subject=SmartShooter%20feedback&body=Describe%20the%20issue%20or%20idea."/>
              <ActionTile icon={Keyboard}  title="Keyboard shortcuts"     subtitle="Work faster with keys" to="#shortcuts"/>
            </div>
          </Surface>

          <Section id="basics" icon={BookOpen} title="Guided basics">
            <div className="space-y-4">
              <Accordion items={[
                { title: "Record a session", defaultOpen: true, children: (
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Click <b>New session</b> on the Dashboard.</li>
                    <li>Pick <i>type</i>, select <i>zones</i>, set <i>rounds</i>, add optional notes.</li>
                    <li>For each round, track <b>made</b> and <b>attempts</b>.</li>
                    <li>Save and watch your <b>heatmaps</b> and <b>trends</b> update.</li>
                  </ul>
                )},
                { title: "Read your heatmaps", children: (
                  <div className="space-y-2" id="heatmaps">
                    <p>Heatmaps show accuracy per zone as color intensity. Labels display <b>Made/Attempts (Acc%)</b>.</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li>Corner labels may render outside the hotzone with a connector line for clarity.</li>
                      <li>On small screens, corner labels fit inside the 3pt arc to avoid clipping.</li>
                      <li>The legend ranges from low to high accuracy; consistent across screens.</li>
                    </ul>
                  </div>
                )},
                { title: "Trends & bar charts", children: (
                  <div className="space-y-2" id="trends">
                    <p>The <b>Accuracy Trend</b> shows your % over time (with a soft gradient like the heatmap legend). The <b>Attempts vs Made</b> chart compares volume and conversions by shot type.</p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li><b>Tooltips</b>: bars show Attempts/Made with accuracy; the trend line shows %.</li>
                      <li><b>Light mode</b> uses stronger axis/grid contrast; dark mode keeps high-contrast labels.</li>
                      <li>Average % is shown in a small pill on the trend card.</li>
                    </ul>
                  </div>
                )},
                // 🆕 XP explanation accordion
                { title: "Earning XP & Levels", children: (
                  <div className="space-y-2" id="xp">
                    <p>
                      Every training session rewards <b>XP</b> based on your shot volume, accuracy, and drill type.
                      Your level increases as your total XP grows.
                    </p>
                    <ul className="list-disc ml-5 space-y-1">
                      <li><b>+1 XP</b> per shot attempted.</li>
                      <li><b>Accuracy bonus</b> (highest tier reached):
                        <ul className="ml-4 list-disc">
                          <li>≥ 90% → +50 XP</li>
                          <li>≥ 80% → +25 XP</li>
                          <li>≥ 70% → +10 XP</li>
                        </ul>
                      </li>
                      <li><b>Type multipliers</b>:
                        <ul className="ml-4 list-disc">
                          <li>Spot ×1.00</li>
                          <li>Catch &amp; Shoot ×1.05</li>
                          <li>Off Dribble ×1.20</li>
                          <li>Run Half Court ×1.50</li>
                        </ul>
                      </li>
                      <li>Formula: <code>(shots + bonus) × multiplier</code>, rounded.</li>
                      <li>Your current progress appears at the top of the Dashboard.</li>
                    </ul>
                    <p className="text-sm text-slate-600 dark:text-neutral-300">
                      Example: 36 shots at 94% (off-dribble) → (36 + 50) × 1.2 = <b>103 XP</b>.
                    </p>
                  </div>
                )},
              ]}/>
            </div>
          </Section>

          <Section id="faq" icon={Info} title="Top FAQs">
            <Accordion items={[
              { title: "How is accuracy calculated?", children: <p>Accuracy = <b>Made ÷ Attempts</b>. Each zone label shows both the raw counts and the percentage.</p> },
              { title: "Why do corner labels move on mobile?", children: <p>To keep text readable, corner labels may shift inside the 3pt arc or outside with a short connector line when space is tight.</p> },
              { title: "Why does the theme toggle say “Light mode” in dark theme?", children: <p>The toggle shows the <i>action</i> you’ll take when clicking it. In dark theme the label is white for contrast.</p> },
              { title: "Can I load sample data? Will it overwrite mine?", children: <p>Loading sample data adds demo sessions only. Your existing data remains unchanged.</p> },
            ]}/>
          </Section>

          <Section id="shortcuts" icon={Keyboard} title="Keyboard shortcuts">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <KbdRow keys={["Shift", "O"]} label="Open onboarding" />
              <KbdRow keys={["/"]}        label="Focus analytics filters" />
              <KbdRow keys={["N"]}        label="New session" />
              <KbdRow keys={["S"]}        label="Seed demo data (dev only)" />
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <Surface className="p-4 md:p-5">
            <div className="text-sm font-semibold mb-2 flex items-center gap-2 text-slate-900 dark:text-neutral-100">
              <Target className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              Quick nav
            </div>
            <nav className="space-y-2 text-sm">
              <SideLink to="#basics" label="Guided basics" />
              <SideLink to="#heatmaps" label="Heatmaps" />
              <SideLink to="#trends" label="Trends & bars" />
              <SideLink to="#xp" label="Earning XP & Levels" />
              <SideLink to="#faq" label="FAQs" />
              <SideLink to="#shortcuts" label="Shortcuts" />
            </nav>

            <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
              <div className="text-xs text-slate-600 dark:text-neutral-300">
                Still stuck?{" "}
                <a className="underline hover:text-orange-700 dark:hover:text-orange-300" href="mailto:support@example.com">
                  Email support
                </a>
              </div>
            </div>
          </Surface>
        </aside>
      </div>
    </div>
  );
}
