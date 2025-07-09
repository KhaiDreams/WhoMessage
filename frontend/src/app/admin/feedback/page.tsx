"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Feedback {
  id: number;
  user_id: number;
  message: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
  };
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFeedbacks = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/feedback?page=${page}&limit=10`);
        setFeedbacks(res.feedbacks);
        setTotalPages(res.totalPages);
      } catch (err) {
        // Se não for admin, redireciona
        router.replace("/home");
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, [page, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <main className="flex flex-col gap-6 w-full max-w-2xl bg-card rounded-2xl shadow-2xl p-8 border border-card-border">
        <h1 className="text-2xl font-bold mb-2">Feedbacks dos usuários</h1>
        {loading ? (
          <div className="text-center">Carregando...</div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center text-foreground/60">Nenhum feedback enviado ainda.</div>
        ) : (
          <ul className="flex flex-col gap-4">
            {feedbacks.map((fb) => (
              <li key={fb.id} className="bg-background border border-card-border rounded-lg p-4">
                <div className="text-sm text-foreground/80 mb-1">
                  <span className="font-semibold">{fb.user.username}</span> &lt;{fb.user.email}&gt; — <span className="text-xs">{new Date(fb.created_at).toLocaleString()}</span>
                </div>
                <div className="text-base text-foreground">{fb.message}</div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-between items-center mt-4">
          <button
            className="px-3 py-1 rounded bg-primary text-white disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span className="text-sm">Página {page} de {totalPages}</span>
          <button
            className="px-3 py-1 rounded bg-primary text-white disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próxima
          </button>
        </div>
      </main>
    </div>
  );
}
