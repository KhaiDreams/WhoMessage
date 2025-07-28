"use client";
import { useState } from "react";

interface WelcomeProps {
  onComplete: () => void;
}

export default function Welcome({ onComplete }: WelcomeProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Bem-vindo ao WhoMessage!",
      subtitle: "A rede social dos gamers",
      description: "Conecte-se com outros gamers que compartilham seus interesses",
      icon: "🎮"
    },
    {
      title: "Encontre seu Match",
      subtitle: "Swipe para descobrir",
      description: "Deslize para a direita se curtir, para a esquerda se não rolar",
      icon: "❤️"
    },
    {
      title: "Chat e Jogue Junto",
      subtitle: "Converse e forme grupos",
      description: "Mande mensagens, forme grupos e marque jogos online",
      icon: "💬"
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-primary/20 to-secondary/20 items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-6">{currentStep.icon}</div>
        <h1 className="text-2xl font-bold text-primary mb-2">{currentStep.title}</h1>
        <h2 className="text-lg text-secondary mb-4">{currentStep.subtitle}</h2>
        <p className="text-gray-600 mb-8">{currentStep.description}</p>
        
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i === step ? 'bg-primary' : 'bg-gray-300'}`} />
          ))}
        </div>
        
        <button 
          onClick={handleNext}
          className="w-full bg-primary text-white py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
        >
          {step === steps.length - 1 ? 'Começar!' : 'Próximo'}
        </button>
      </div>
    </div>
  );
}
