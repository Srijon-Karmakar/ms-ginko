import type { Metadata } from "next";
import Image from "next/image";

import { galleryItems } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Explore the atmosphere, dishes, and dining spaces of Ms Ginko.",
};

export default function GalleryPage() {
  return (
    <div className="page-wrapper space-y-8">
      <section className="ui-panel p-8 sm:p-10">
        <p className="ui-eyebrow reveal-text">Gallery</p>
        <h1 className="reveal-text mt-3 text-5xl text-[var(--foreground)]" style={{ animationDelay: "120ms" }}>
          Inside the Ms Ginko Experience
        </h1>
        <p className="ui-copy mt-4 max-w-3xl text-base leading-7">
          A glimpse of our dining rooms, service moments, and signature presentations.
        </p>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {galleryItems.map((item, index) => (
          <article
            key={item.id}
            className="ui-card group overflow-hidden animate-fade-in-up"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div className="relative h-64">
              <Image src={item.image} alt={item.alt} fill className="object-cover transition duration-500 group-hover:scale-105" />
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
              <p className="ui-copy text-xs">{item.alt}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
