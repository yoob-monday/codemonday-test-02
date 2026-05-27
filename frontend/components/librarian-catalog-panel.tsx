"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { authorizedJsonRequest } from "@/lib/auth";
import type { Book } from "@/lib/library-data";

export function LibrarianCatalogPanel() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (user?.role !== "librarian" || !token) {
    return null;
  }

  const authToken = token;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const form = event.currentTarget;

    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await authorizedJsonRequest<Book>("/books", authToken, {
          method: "POST",
          body: JSON.stringify({
            title: String(formData.get("title") || ""),
            author: String(formData.get("author") || ""),
            category: String(formData.get("category") || ""),
            totalCopies: Number(formData.get("totalCopies") || 1)
          })
        });

        form.reset();
        setSuccess("Book added to the catalog.");
        router.refresh();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error ? submissionError.message : "Could not add book."
        );
      }
    });
  }

  return (
    <section className="panel librarian-panel">
      <p className="eyebrow">Librarian</p>
      <h2 className="panel-title">Add books to the catalog</h2>
      <form className="librarian-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Title</span>
          <input name="title" type="text" required />
        </label>
        <label className="auth-field">
          <span>Author</span>
          <input name="author" type="text" required />
        </label>
        <label className="auth-field">
          <span>Category</span>
          <select name="category" defaultValue="general">
            <option value="textbook">Textbook</option>
            <option value="general">General</option>
            <option value="novel">Novel</option>
          </select>
        </label>
        <label className="auth-field">
          <span>Copies</span>
          <input name="totalCopies" type="number" min={1} defaultValue={1} required />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        {success ? <p className="auth-success">{success}</p> : null}
        <button type="submit" className="button button-primary" disabled={isPending}>
          {isPending ? "Saving..." : "Add Book"}
        </button>
      </form>
    </section>
  );
}
