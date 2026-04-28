"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AuthModal } from "@/components/auth/auth-modal";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SeedTestimonial = {
  id: string;
  name: string;
  quote: string;
  rating: number;
};

type DisplayTestimonial = SeedTestimonial & {
  source: "seed" | "db";
};

type TestimonialRailsSectionProps = {
  initialTestimonials: SeedTestimonial[];
};

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

const getReviewerAvatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&radius=50&backgroundType=gradientLinear&fontWeight=700`;

const clampRating = (rating: number) => Math.max(1, Math.min(5, Math.round(rating)));

const getFallbackName = (email: string | null | undefined) => {
  if (!email) return "Guest";
  const handle = email.split("@")[0]?.trim();
  return handle ? handle : "Guest";
};

export function TestimonialRailsSection({ initialTestimonials }: TestimonialRailsSectionProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const seedReviews = useMemo<DisplayTestimonial[]>(
    () =>
      initialTestimonials.map((item) => ({
        ...item,
        rating: clampRating(item.rating),
        source: "seed",
      })),
    [initialTestimonials]
  );

  const [reviews, setReviews] = useState<DisplayTestimonial[]>(seedReviews);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [pendingComposeAfterAuth, setPendingComposeAfterAuth] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState("");
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, reviewer_name, rating, quote, created_at")
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      setReviews(seedReviews);
      setLoadingReviews(false);
      return;
    }

    const dbReviews: DisplayTestimonial[] = (data ?? []).map((item) => ({
      id: item.id,
      name: item.reviewer_name,
      quote: item.quote,
      rating: clampRating(item.rating),
      source: "db",
    }));

    setReviews([...dbReviews, ...seedReviews]);
    setLoadingReviews(false);
  }, [seedReviews, supabase]);

  useEffect(() => {
    let isMounted = true;

    const loadAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;
      setUserEmail(user?.email ?? null);

      const nameFromMeta =
        typeof user?.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name.trim()
          : "";

      setReviewerName((previous) =>
        previous.trim().length > 0 ? previous : nameFromMeta || getFallbackName(user?.email)
      );
      setLoadingUser(false);
    };

    void loadAuth();
    void fetchReviews();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUserEmail(session?.user?.email ?? null);
      const nameFromMeta =
        typeof session?.user?.user_metadata?.full_name === "string"
          ? session.user.user_metadata.full_name.trim()
          : "";

      setReviewerName((previous) =>
        previous.trim().length > 0 ? previous : nameFromMeta || getFallbackName(session?.user?.email)
      );

    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchReviews, supabase.auth, supabase]);

  useEffect(() => {
    if (!userEmail || !pendingComposeAfterAuth) return;
    setAuthOpen(false);
    setComposeOpen(true);
    setPendingComposeAfterAuth(false);
  }, [pendingComposeAfterAuth, userEmail]);

  const normalizedRailSource = useMemo(() => {
    const base = reviews.length > 0 ? reviews : seedReviews;
    if (base.length === 0) return [];

    const minCards = 8;
    const normalized: DisplayTestimonial[] = [...base];
    while (normalized.length < minCards) {
      normalized.push(...base);
    }
    return normalized.slice(0, Math.max(minCards, base.length));
  }, [reviews, seedReviews]);

  const testimonialRailTop = useMemo(
    () => [...normalizedRailSource, ...normalizedRailSource],
    [normalizedRailSource]
  );
  const testimonialRailBottom = useMemo(
    () => [...normalizedRailSource].reverse().concat([...normalizedRailSource].reverse()),
    [normalizedRailSource]
  );

  const onStartReview = () => {
    setStatus(null);

    if (!userEmail) {
      setPendingComposeAfterAuth(true);
      setAuthOpen(true);
      return;
    }

    setComposeOpen(true);
  };

  const onSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!userEmail) {
      setPendingComposeAfterAuth(true);
      setComposeOpen(false);
      setAuthOpen(true);
      return;
    }

    const cleanedQuote = reviewText.trim();
    const cleanedName = reviewerName.trim() || getFallbackName(userEmail);

    if (cleanedQuote.length < 12) {
      setStatus({ ok: false, message: "Review must be at least 12 characters." });
      return;
    }

    const rating = clampRating(selectedRating);
    const optimisticReview: DisplayTestimonial = {
      id: `optimistic-${Date.now()}`,
      name: cleanedName,
      quote: cleanedQuote,
      rating,
      source: "db",
    };

    const snapshot = reviews;
    setReviews((previous) => [optimisticReview, ...previous]);

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      reviewer_name: cleanedName,
      quote: cleanedQuote,
      rating,
    });
    setSubmitting(false);

    if (error) {
      setReviews(snapshot);
      setStatus({ ok: false, message: error.message });
      return;
    }

    setReviewText("");
    setComposeOpen(false);
    setStatus({ ok: true, message: "Thanks, your review is live now." });
    await fetchReviews();
  };

  return (
    <section id="testimonial" className="bg-[var(--background)] py-10 sm:py-14">
      <div className="page-inner">
        <p className="ui-eyebrow scroll-reveal text-center">Testimonial</p>
        <h2
          className="scroll-reveal mx-auto mt-2 max-w-3xl text-center text-3xl font-bold italic leading-tight text-[var(--foreground)] sm:text-4xl"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Words of praise from guests about Ms Ginko.
        </h2>
      </div>

      <div className="testimonial-rails mt-6 sm:mt-8" aria-label="Guest testimonials">
        <div className="testimonial-rail testimonial-rail--ltr">
          <div className="testimonial-rail-track">
            {testimonialRailTop.map((item, idx) => (
              <article key={`top-${item.source}-${item.id}-${idx}`} className="testimonial-rail-card">
                <p className="testimonial-rail-quote">{"\u201C"}</p>
                <p className="testimonial-rail-copy">{item.quote}</p>
                <div className="testimonial-rail-rating" aria-label={`Rated ${item.rating} out of 5`}>
                  <span className="testimonial-rail-stars">
                    {"\u2605".repeat(item.rating)}
                    {"\u2606".repeat(5 - item.rating)}
                  </span>
                  <span className="testimonial-rail-score">{item.rating}.0</span>
                </div>
                <div className="testimonial-rail-meta">
                  <img
                    src={getReviewerAvatarUrl(item.name)}
                    alt={`${item.name} avatar`}
                    className="testimonial-rail-avatar-img"
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <p className="testimonial-rail-name">{item.name}</p>
                    <p className="testimonial-rail-role">Guest at Ms Ginko</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="testimonial-rail testimonial-rail--rtl">
          <div className="testimonial-rail-track">
            {testimonialRailBottom.map((item, idx) => (
              <article key={`bottom-${item.source}-${item.id}-${idx}`} className="testimonial-rail-card">
                <p className="testimonial-rail-quote">{"\u201C"}</p>
                <p className="testimonial-rail-copy">{item.quote}</p>
                <div className="testimonial-rail-rating" aria-label={`Rated ${item.rating} out of 5`}>
                  <span className="testimonial-rail-stars">
                    {"\u2605".repeat(item.rating)}
                    {"\u2606".repeat(5 - item.rating)}
                  </span>
                  <span className="testimonial-rail-score">{item.rating}.0</span>
                </div>
                <div className="testimonial-rail-meta">
                  <img
                    src={getReviewerAvatarUrl(item.name)}
                    alt={`${item.name} avatar`}
                    className="testimonial-rail-avatar-img"
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <p className="testimonial-rail-name">{item.name}</p>
                    <p className="testimonial-rail-role">Guest at Ms Ginko</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {loadingReviews ? <p className="ui-copy mt-4 text-center text-sm">Loading live reviews...</p> : null}

      <div className="page-inner">
        <div className="mx-auto mt-7 max-w-3xl text-center sm:mt-9">
          <p className="ui-eyebrow">Visited Us ! Want to share a Review ?</p>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Select rating">
              {STAR_VALUES.map((value) => {
                const active = value <= selectedRating;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedRating(value)}
                    className="rounded-md px-1 py-0.5 text-2xl leading-none transition-colors sm:text-[1.7rem]"
                    aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                    aria-pressed={active}
                    style={{
                      color: active
                        ? "color-mix(in srgb, var(--accent) 82%, #f0c430)"
                        : "color-mix(in srgb, var(--muted) 58%, transparent)",
                    }}
                  >
                    {"\u2605"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex justify-center">
            <button type="button" onClick={onStartReview} className="ui-btn-primary px-4 py-2 text-[11px]">
              Add Review
            </button>
          </div>

          <p className="ui-copy mt-2 text-xs sm:text-sm">
            {loadingUser
              ? "Checking login..."
              : userEmail
                ? `Signed in as ${userEmail}`
                : "Login required to submit."}
          </p>

          {composeOpen ? (
            <form className="mx-auto mt-4 grid max-w-2xl gap-3" onSubmit={onSubmitReview}>
              <div className="grid gap-3">
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(event) => setReviewerName(event.currentTarget.value)}
                  maxLength={60}
                  className="ui-field text-center"
                  placeholder="Your name"
                />
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.currentTarget.value)}
                  maxLength={340}
                  className="ui-field min-h-[108px] resize-y text-center"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-btn-primary w-full justify-center px-4 py-2 text-[11px] disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? "Posting..." : "Post Review"}
                </button>
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="ui-btn-secondary w-full justify-center px-4 py-2 text-[11px] sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {status ? (
            <p className={`mt-3 text-sm ${status.ok ? "text-emerald-700" : "text-red-700"}`}>
              {status.message}
            </p>
          ) : null}
        </div>
      </div>

      {authOpen ? (
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          nextPath="/#testimonial"
          onAuthSuccess={() => {
            setComposeOpen(true);
            setPendingComposeAfterAuth(false);
          }}
        />
      ) : null}
    </section>
  );
}
