import { router } from 'expo-router';

export function navigateTo(path: string) {
  router.push(path as never);
}

export function replaceTo(path: string) {
  router.replace(path as never);
}

export function goBack() {
  if (router.canGoBack()) {
    router.back();
  }
}
