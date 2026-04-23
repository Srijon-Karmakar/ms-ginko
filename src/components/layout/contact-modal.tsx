"use client";

import { FormEvent, useState } from "react";

import { siteConfig } from "@/lib/site-data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ContactModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ContactModal({ open, onClose }: ContactModalProps) {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setState("sending");
    setErrorMessage("");

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
    });

    if (error) {
      setErrorMessage(error.message ?? "Could not send your message right now.");
      setState("error");
      return;
    }

    setState("success");
    form.reset();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="ui-eyebrow">Contact Ms Ginko</p>
            <h3 className="font-serif text-3xl text-[var(--foreground)]">Tell us what you need</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-btn-secondary px-3 py-1 text-[11px]"
          >
            Close
          </button>
        </div>

        <div className="ui-card ui-copy mb-6 p-4 text-sm">
          <p>{siteConfig.phone}</p>
          <p>{siteConfig.email}</p>
          <p>{siteConfig.address}</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">Name</span>
            <input type="text" name="name" required className="ui-field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">Email</span>
            <input type="email" name="email" required className="ui-field" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[var(--foreground)]">Message</span>
            <textarea
              name="message"
              required
              minLength={12}
              rows={4}
              className="ui-field"
            />
          </label>

          <button
            type="submit"
            disabled={state === "sending"}
            className="ui-btn-primary px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "sending" ? "Sending..." : "Send Message"}
          </button>

          {state === "success" ? (
            <p className="text-sm text-emerald-700">Your message was sent. We will get back to you shortly.</p>
          ) : null}
          {state === "error" ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
        </form>
      </div>
    </div>
  );
}
