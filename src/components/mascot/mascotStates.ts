// Mascot state machine configuration

export type MascotState = 'idle' | 'typing' | 'success' | 'error' | 'thinking';

export interface MascotBehavior {
  animation: string;
  message: string;
  duration?: number;
  confetti?: boolean;
  shake?: boolean;
  speechPosition?: 'bottom-left' | 'bottom-center';
}

export const mascotBehaviors: Record<MascotState, MascotBehavior> = {
  idle: {
    animation: '/lottie/idle.json',
    message: "Готовий, коли ви готові! 🎯",
    duration: Infinity,
    speechPosition: 'bottom-left'
  },
  typing: {
    animation: '/lottie/typing.json',
    message: "Виглядає тактично! 💪",
    duration: Infinity,
    speechPosition: 'bottom-left'
  },
  success: {
    animation: '/lottie/success.json',
    message: "Місія виконана! 🎖️",
    duration: 3000,
    confetti: true,
    speechPosition: 'bottom-center'
  },
  error: {
    animation: '/lottie/error.json',
    message: "Помилка, але ми прикриємо вас! 🛡️",
    duration: 3000,
    shake: true,
    speechPosition: 'bottom-center'
  },
  thinking: {
    animation: '/lottie/typing.json',
    message: "Обробка даних... ⚙️",
    duration: Infinity,
    speechPosition: 'bottom-left'
  }
};
