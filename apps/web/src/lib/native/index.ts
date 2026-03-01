import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { PushNotifications } from '@capacitor/push-notifications';

// Platform detection
export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isWeb = Capacitor.getPlatform() === 'web';

// Haptics
export const haptic = {
  light: () => isNative && Haptics.impact({ style: ImpactStyle.Light }),
  medium: () => isNative && Haptics.impact({ style: ImpactStyle.Medium }),
  heavy: () => isNative && Haptics.impact({ style: ImpactStyle.Heavy }),
  success: () => isNative && Haptics.notification({ type: NotificationType.Success }),
  warning: () => isNative && Haptics.notification({ type: NotificationType.Warning }),
  error: () => isNative && Haptics.notification({ type: NotificationType.Error }),
  selection: () => isNative && Haptics.selectionStart(),
};

// Keyboard
export const keyboard = {
  hide: () => isNative && Keyboard.hide(),
  show: () => isNative && Keyboard.show(),
  onShow: (cb: (info: { keyboardHeight: number }) => void) => {
    if (isNative) return Keyboard.addListener('keyboardWillShow', cb);
  },
  onHide: (cb: () => void) => {
    if (isNative) return Keyboard.addListener('keyboardWillHide', cb);
  },
};

// Status bar
export const statusBar = {
  setLight: () => {
    if (!isNative) return;
    StatusBar.setStyle({ style: Style.Light });
    if (isAndroid) StatusBar.setBackgroundColor({ color: '#FFFFFF' });
  },
  setDark: () => {
    if (!isNative) return;
    StatusBar.setStyle({ style: Style.Dark });
    if (isAndroid) StatusBar.setBackgroundColor({ color: '#000000' });
  },
  hide: () => isNative && StatusBar.hide(),
  show: () => isNative && StatusBar.show(),
};

// Splash screen
export const splashScreen = {
  hide: () => isNative && SplashScreen.hide(),
  show: () => isNative && SplashScreen.show(),
};

// In-app browser
export const browser = {
  open: async (url: string) => {
    if (isNative) {
      await Browser.open({ url, presentationStyle: 'popover' });
    } else {
      window.open(url, '_blank');
    }
  },
  close: async () => isNative && Browser.close(),
};

// Share
export const share = {
  share: async (options: { title?: string; text?: string; url?: string }) => {
    if (isNative) {
      await Share.share(options);
    } else if (navigator.share) {
      await navigator.share(options);
    } else {
      await navigator.clipboard.writeText(options.url || options.text || '');
    }
  },
  canShare: () => isNative || 'share' in navigator,
};

// App lifecycle
export const appLifecycle = {
  onStateChange: (cb: (state: { isActive: boolean }) => void) => {
    if (isNative) return App.addListener('appStateChange', cb);
  },
  onUrlOpen: (cb: (data: { url: string }) => void) => {
    if (isNative) return App.addListener('appUrlOpen', cb);
  },
  onBackButton: (cb: () => void) => {
    if (isNative) return App.addListener('backButton', cb);
  },
  exitApp: () => isNative && App.exitApp(),
  getInfo: async () => {
    if (isNative) return App.getInfo();
    return { name: 'Mr. Blu', version: '1.0.0', build: '1', id: 'com.mrblu.app' };
  },
};

// Push notifications
export const pushNotifications = {
  requestPermission: async () => {
    if (!isNative) return { granted: false };
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive === 'granted') await PushNotifications.register();
    return { granted: permission.receive === 'granted' };
  },
  getToken: () =>
    new Promise<string | null>((resolve) => {
      if (!isNative) return resolve(null);
      PushNotifications.addListener('registration', (token) => resolve(token.value));
      PushNotifications.addListener('registrationError', () => resolve(null));
    }),
  onNotification: (cb: (notification: unknown) => void) => {
    if (isNative) return PushNotifications.addListener('pushNotificationReceived', cb);
  },
  onNotificationAction: (cb: (action: unknown) => void) => {
    if (isNative) return PushNotifications.addListener('pushNotificationActionPerformed', cb);
  },
};

// Microphone permissions
export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export const microphone = {
  checkPermission: async (): Promise<PermissionStatus> => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state as PermissionStatus;
    } catch {
      return 'prompt';
    }
  },

  requestPermission: async (): Promise<PermissionStatus> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return 'granted';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        return 'denied';
      }
      return 'denied';
    }
  },
};

// Deep link handler
function handleDeepLink(url: string) {
  const parsed = new URL(url);
  if (parsed.pathname.includes('/auth/callback')) {
    window.location.href = url;
  }
}

// Initialization — call once on app startup
export async function initializeNative() {
  if (!isNative) return;

  await splashScreen.hide();
  statusBar.setLight();

  appLifecycle.onUrlOpen(({ url }) => handleDeepLink(url));

  if (isAndroid) {
    appLifecycle.onBackButton(() => window.history.back());
  }
}
