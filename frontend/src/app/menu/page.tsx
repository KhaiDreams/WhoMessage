"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Menu() {
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setMessage("Dentro do site e autorizado");
          // Se está autenticado, redireciona para /home
          router.replace("/home");
        } else {
          setMessage("Recusado, precisa logar novamente");
          router.replace("/login");
        }
      } catch (error) {
        console.error("Failed to fetch:", error);
        setMessage("Recusado, precisa logar novamente");
        router.replace("/login");
      }
    };

    fetchData();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 sm:p-20">
      <h1>{message}</h1>
      {userData && <pre>{JSON.stringify(userData, null, 2)}</pre>}
    </div>
  );
}
