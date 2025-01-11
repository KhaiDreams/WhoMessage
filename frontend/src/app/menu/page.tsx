"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Menu() {
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Recusado, precisa logar novamente");
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
        } else {
          setMessage("Recusado, precisa logar novamente");
        }
      } catch (error) {
        console.error("Failed to fetch:", error);
        setMessage("Recusado, precisa logar novamente");
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
