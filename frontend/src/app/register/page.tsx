"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "@/lib/api";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    bio: "",
    age: "",
    nicknames: "",
    active: true,
    is_admin: false,
    ban: false,
  });

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await apiFetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age, 10),
          nicknames: formData.nicknames.split(",").map(nickname => nickname.trim())
        }),
      });
      router.push("/login");
    } catch (error) {
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 sm:p-20">
      <Image
        className="white:invert"
        src="/assets/logo-removebg-preview.png"
        alt="WhoMessage Logo"
        width={400}
        height={40}
        priority
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="p-3 border rounded w-full text-black"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="p-3 border rounded w-full text-black"
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Username (Ele será usado para te identificar)"
          value={formData.username}
          onChange={handleChange}
          className="p-3 border rounded w-full text-black"
          required
        />
        <textarea
          name="bio"
          placeholder="Bio"
          value={formData.bio}
          onChange={handleChange}
          className="p-3 border rounded w-full text-black"
          required
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleChange}
          className="p-3 border rounded w-full text-black"
          required
        />
        <input
          type="text"
          name="nicknames"
          placeholder="Nickname (Nome que as pessoas iram te chamar)"
          value={formData.nicknames}
          onChange={handleChange}
          className="p-3 border rounded w-full text-black"
          required
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Register
        </button>
      </form>
      <Link href="/login" className="text-blue-500 mt-4">
        Já tem uma conta? Logue aqui
      </Link>
    </div>
  );
}
