import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn the story, approach, and culinary philosophy behind Ms Ginko.",
};

export default function AboutPage() {
  return (
    <div className="page-wrapper space-y-10">
      <section className="ui-panel p-8 sm:p-10">
        <p className="ui-eyebrow reveal-text">About Ms Ginko</p>
        <h1 className="reveal-text mt-3 text-5xl text-[var(--foreground)]" style={{ animationDelay: "120ms" }}>
          A Kitchen Built on Detail
        </h1>
        <p className="ui-copy mt-5 max-w-3xl text-base leading-7">
          Ms Ginko was created around one idea: elegant dining can stay warm and personal. Our team works with
          seasonal ingredients, balanced plating, and hospitality that feels measured rather than rushed.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          ["Our Philosophy", "Fewer ingredients, clearer flavor, and carefully paced service."],
          ["Sourcing", "Seasonal produce and trusted local suppliers for meat, seafood, and greens."],
          ["Experience", "Open-kitchen energy paired with calm table service and curated music."],
        ].map(([title, body]) => (
          <article key={title} className="ui-card p-6">
            <h2 className="text-2xl text-[var(--foreground)]">{title}</h2>
            <p className="ui-copy mt-3 text-sm leading-6">{body}</p>
          </article>
        ))}
      </section>

      <section className="ui-panel p-8">
        <p className="ui-eyebrow">Chef Notes</p>
        <p className="ui-copy reveal-text mt-3 max-w-3xl text-base leading-7">
          &quot;Ms Ginko is about restraint and confidence. We build every menu to feel memorable without being
          heavy, and every dish has one clear lead note that guests can remember.&quot; - Chef House Team
        </p>
      </section>
    </div>
  );
}
