"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    bio: "",
    age: "",
    nickname: "", // Nickname atual/ativo
    active: true,
    is_admin: false,
    ban: false,
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [bioError, setBioError] = useState("");
  const [isBioFocused, setIsBioFocused] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isTypingPassword, setIsTypingPassword] = useState(false);

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "bio") {
      if (value.length > 300) {
        setBioError("A descrição não pode ter mais que 300 caracteres.");
      } else {
        setBioError("");
      }
    }
    if (name === "password") {
      setIsTypingPassword(true);
      validatePassword(value);
      // Atualiza confirmação ao mudar senha
      if (confirmPassword && value !== confirmPassword) {
        setConfirmPasswordError("As senhas não coincidem.");
      } else {
        setConfirmPasswordError("");
      }
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (formData.password !== value) {
      setConfirmPasswordError("As senhas não coincidem.");
    } else {
      setConfirmPasswordError("");
    }
  };

  function validatePassword(password: string) {
    // Mínimo 8 caracteres, pelo menos uma letra maiúscula, um número e um caractere especial
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    let error = "";
    if (!password) {
      setPasswordError("");
      setPasswordStrength("");
      return;
    }
    if (password.length < 8) {
      error = "A senha deve ter pelo menos 8 caracteres.";
      setPasswordStrength("fraca");
    } else if (!hasUpper || !hasNumber || !hasSpecial) {
      error = "A senha deve conter pelo menos 1 maiúscula, 1 número e 1 caractere especial.";
      setPasswordStrength("média");
    } else {
      setPasswordStrength("forte");
    }
    setPasswordError(error);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (bioError || passwordError || confirmPasswordError || !confirmPassword) return;
    try {
      // Se o usuário não definiu um nickname, usar o username como padrão
      const nicknameToUse = formData.nickname.trim() || formData.username;

      const res = await api.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        email: formData.email,
        password: formData.password,
        username: formData.username,
        bio: formData.bio,
        age: parseInt(formData.age),
        nicknames: [nicknameToUse],
        active: formData.active,
        is_admin: formData.is_admin,
        ban: formData.ban,
      });
      if (res.token) {
        localStorage.setItem('token', res.token);
      }
      // Após criar conta, deve ir para games primeiro, não interests
      router.push('/choose-games');
    } catch (error) {
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <main className="flex flex-col gap-8 items-center w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 border border-card-border">
        <Image
          className="white:invert mb-2"
          src="/assets/logo-removebg-preview.png"
          alt="WhoMessage Logo"
          width={220}
          height={40}
          priority
        />
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          <input
            type="text"
            name="username"
            placeholder="Nome de usuário (único)"
            value={formData.username}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
            required
          />
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Senha"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setIsTypingPassword(true)}
              onBlur={() => setIsTypingPassword(false)}
              className={`px-4 py-3 pr-12 rounded-lg bg-input-bg border ${passwordError ? 'border-red-500' : 'border-input-border'} text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200 w-full`}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary focus:outline-none"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-7 0-1.13.47-2.36 1.32-3.54m2.1-2.38C7.7 5.7 9.76 5 12 5c5 0 9 4.03 9 7 0 1.13-.47 2.36-1.32 3.54-.36.5-.78.98-1.25 1.43M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          <div className="relative w-full">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirme a senha"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className={`px-4 py-3 pr-12 rounded-lg bg-input-bg border ${confirmPasswordError ? 'border-red-500' : 'border-input-border'} text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200 w-full`}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary focus:outline-none"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4.03-9-7 0-1.13.47-2.36 1.32-3.54m2.1-2.38C7.7 5.7 9.76 5 12 5c5 0 9 4.03 9 7 0 1.13-.47 2.36-1.32 3.54-.36.5-.78.98-1.25 1.43M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          {(passwordStrength || passwordError || confirmPasswordError || (isTypingPassword && passwordStrength !== 'forte') || (!confirmPasswordError && confirmPassword)) && (
            <div className="flex flex-col gap-1">
              {(passwordStrength || passwordError) && (
                <div className="flex items-center gap-2">
                  {passwordStrength && (
                    <span className={`text-xs font-semibold ${passwordStrength === 'forte' ? 'text-green-600' : passwordStrength === 'média' ? 'text-yellow-600' : 'text-red-600'}`}>Senha {passwordStrength}</span>
                  )}
                  {passwordError && <span className="text-xs text-red-500">{passwordError}</span>}
                </div>
              )}
              {(confirmPasswordError || (!confirmPasswordError && confirmPassword)) && (
                <div className="flex items-center gap-2">
                  {confirmPasswordError && <span className="text-xs text-red-500">{confirmPasswordError}</span>}
                  {!confirmPasswordError && confirmPassword && <span className="text-xs text-green-600">Senhas conferem</span>}
                </div>
              )}
              {isTypingPassword && passwordStrength !== 'forte' && (
                <div className="flex flex-wrap gap-x-2 gap-y-0 text-xs text-yellow-600 mt-0 animate-fade-in transition-all duration-200">
                  <span className={formData.password.length >= 8 ? 'text-green-600' : ''}>• Mínimo 8 caracteres</span>
                  <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : ''}>• 1 maiúscula</span>
                  <span className={/\d/.test(formData.password) ? 'text-green-600' : ''}>• 1 número</span>
                  <span className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password) ? 'text-green-600' : ''}>• 1 caractere especial</span>
                </div>
              )}
            </div>
          )}
          <input
            type="number"
            name="age"
            placeholder="Idade"
            value={formData.age}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
            required
          />
          
          {/* Campo de Nickname */}
          <input
            type="text"
            name="nickname"
            placeholder="Como as pessoas vão te chamar"
            value={formData.nickname}
            onChange={handleChange}
            className="px-4 py-3 rounded-lg bg-input-bg border border-input-border text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200"
          />

          <textarea
            name="bio"
            placeholder="Bio (opcional, até 300 caracteres)"
            value={formData.bio}
            onChange={handleChange}
            maxLength={300}
            onFocus={() => setIsBioFocused(true)}
            onBlur={() => setIsBioFocused(false)}
            className={`px-4 py-3 rounded-lg bg-input-bg border ${bioError ? 'border-red-500' : 'border-input-border'} text-input-text placeholder-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-input-focus transition-all duration-200 resize-none`}
            rows={3}
          />
          {(bioError || isBioFocused) && (
            <div className="flex justify-between items-center min-h-[24px]">
              <span className={`text-xs ${bioError ? 'text-red-500' : 'text-foreground/60'}`}>{bioError || `${formData.bio.length}/300 caracteres`}</span>
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-gradient-to-r from-pink-600 via-fuchsia-700 to-indigo-700 text-white font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200 ease-in-out tracking-wide text-lg border-none outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          >
            <span className="flex items-center justify-center gap-2">
              {/* Novo ícone: bonequinho com cabeça reta */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7.5" r="4" fill="#fff" stroke="#fff"/><ellipse cx="12" cy="16.5" rx="7" ry="4.5" fill="#fff" stroke="#fff"/><circle cx="12" cy="7.5" r="2" fill="#6366f1" stroke="#6366f1"/></svg>
              Cadastrar
            </span>
          </button>
        </form>
        <p className="text-sm text-foreground/70 text-center mt-2">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold transition-colors">Entrar</Link>
        </p>
      </main>
    </div>
  );
}
