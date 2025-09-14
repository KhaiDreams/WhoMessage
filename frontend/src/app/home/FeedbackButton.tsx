"use client";
import { useState } from "react";
import api from "@/lib/api";

export default function FeedbackButton({ isVisible = true }: { isVisible?: boolean }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/api/feedback", { message });
      setSuccess("Feedback enviado com sucesso!");
      setMessage("");
      setOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Erro ao enviar feedback.");
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <button
        className="bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-all"
        onClick={() => setOpen((v) => !v)}
      >
        Feedback
      </button>
      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-2 bg-card border border-card-border rounded-xl p-4 flex flex-col gap-2 shadow-xl min-w-[260px]"
        >
          <textarea
            className="rounded p-2 border border-input-border bg-input-bg text-input-text resize-none"
            rows={3}
            placeholder="Deixe seu feedback..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            minLength={3}
            maxLength={500}
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="text-xs text-foreground/60 hover:underline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >Cancelar</button>
            <button
              type="submit"
              className="bg-primary text-white px-3 py-1 rounded disabled:opacity-50"
              disabled={loading || message.length < 3}
            >Enviar</button>
          </div>
          {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          {success && <div className="text-xs text-green-600 mt-1">{success}</div>}
        </form>
      )}
    </div>
  );
}
