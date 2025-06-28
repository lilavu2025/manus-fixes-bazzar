// نظام إشعارات محسن مع أصوات وتأثيرات بصرية - نسخة مبسطة
import { toast } from 'sonner';

// إعدادات الإشعارات المحسنة
interface EnhancedToastOptions {
  sound?: boolean;
  duration?: number;
  important?: boolean;
}

// فئة الإشعارات المحسنة
export class EnhancedToast {
  private defaultOptions: EnhancedToastOptions = {
    sound: true,
    duration: 4000,
    important: false
  };

  // نجاح مع تأثيرات
  success(message: string, options: EnhancedToastOptions = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    // صوت بسيط للنجاح
    if (opts.sound && 'AudioContext' in window) {
      this.playSuccessSound();
    }

    return toast.success(message, {
      duration: opts.duration,
      className: opts.important ? 'border-l-4 border-green-500 shadow-lg' : '',
    });
  }

  // خطأ مع تأثيرات
  error(message: string, options: EnhancedToastOptions = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    if (opts.sound && 'AudioContext' in window) {
      this.playErrorSound();
    }

    return toast.error(message, {
      duration: opts.duration ? opts.duration * 1.5 : 6000,
      className: opts.important ? 'border-l-4 border-red-500 shadow-lg' : '',
    });
  }

  // تحذير
  warning(message: string, options: EnhancedToastOptions = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    if (opts.sound && 'AudioContext' in window) {
      this.playWarningSound();
    }

    return toast.warning(message, {
      duration: opts.duration,
      className: opts.important ? 'border-l-4 border-yellow-500 shadow-lg' : '',
    });
  }

  // معلومات
  info(message: string, options: EnhancedToastOptions = {}) {
    const opts = { ...this.defaultOptions, ...options };

    return toast.info(message, {
      duration: opts.duration,
      className: 'border-l-4 border-blue-500',
    });
  }

  // أصوات بسيطة
  private playSuccessSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // تجاهل الأخطاء الصوتية
    }
  }

  private playErrorSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
      // تجاهل الأخطاء الصوتية
    }
  }

  private playWarningSound() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // تجاهل الأخطاء الصوتية
    }
  }

  // تحكم في الأصوات
  enableSounds(enabled: boolean = true) {
    localStorage.setItem('notificationSounds', enabled.toString());
    this.info(enabled ? 'تم تفعيل أصوات الإشعارات' : 'تم إلغاء أصوات الإشعارات');
  }

  // إشعار تقدم العملية
  loading(message: string, promise: Promise<any>) {
    return toast.promise(promise, {
      loading: message,
      success: 'تم بنجاح!',
      error: 'حدث خطأ!',
    });
  }
}

// مثيل مشترك
export const enhancedToast = new EnhancedToast();
