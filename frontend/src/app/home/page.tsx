import Image from 'next/image';
import FeedbackButton from "./FeedbackButton";
import AdminButton from "./AdminButton";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <main className="flex flex-col gap-8 items-center w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 border border-card-border relative">
        <div className="w-full flex justify-end mb-2">
          <AdminButton />
        </div>
        <Image
          className="white:invert mb-2"
          src="/assets/logo-removebg-preview.png"
          alt="WhoMessage Logo"
          width={220}
          height={40}
          priority
        />
        <h1 className="text-3xl font-bold text-foreground mb-2 text-center">Bem-vindo ao WhoMessage!</h1>
        <p className="text-foreground/80 text-lg text-center">Aqui será o seu feed estilo "Swipe" para gamers.<br/>(Em breve!)</p>
        <p className="text-foreground/80 text-lg text-center">Precisamos de mais usuários para enfim lançarmos o aplicativo</p>
        <p className="text-foreground/80 text-lg text-center">Logo na playstore!</p>
        <FeedbackButton />
      </main>
    </div>
  );
}
