import { DrawLine, Reveal, SplitText } from '@/components/motion';

export function PageIntro({ eyebrow, title, accent, lead }: { eyebrow?: string; title: string; accent?: string[]; lead?: string }) {
  return (
    <section className="relative overflow-hidden pb-12 pt-16 md:pb-20 md:pt-24">
      <div className="container-site">
        {eyebrow ? <p className="mb-4 text-sm font-medium uppercase tracking-widest text-ink-soft">{eyebrow}</p> : null}
        <SplitText as="h1" text={title} accent={accent} immediate className="text-display max-w-4xl" />
        {lead ? (
          <Reveal immediate delay={300} className="mt-6 max-w-2xl">
            <p className="text-lead">{lead}</p>
          </Reveal>
        ) : null}
        <DrawLine immediate className="mt-10 h-16 w-full max-w-md text-accent" />
      </div>
    </section>
  );
}
