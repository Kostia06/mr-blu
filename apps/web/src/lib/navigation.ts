import { navigate } from 'wouter/use-browser-location'

export function navigateTo(path: string) {
  navigate(path)
}
