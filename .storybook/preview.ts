import type { Preview } from '@storybook/sveltekit'
import '../src/app.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        iphoneSE: { name: 'iPhone SE', styles: { width: '375px', height: '667px' } },
        iphone14: { name: 'iPhone 14', styles: { width: '390px', height: '844px' } },
        iphone14ProMax: { name: 'iPhone 14 Pro Max', styles: { width: '430px', height: '932px' } },
        pixel7: { name: 'Pixel 7', styles: { width: '412px', height: '915px' } },
        ipadMini: { name: 'iPad Mini', styles: { width: '768px', height: '1024px' } },
        ipadPro: { name: 'iPad Pro', styles: { width: '1024px', height: '1366px' } },
        desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' } },
      },
    },
    backgrounds: {
      values: [
        { name: 'light', value: '#F2F2F7' },
        { name: 'dark', value: '#1C1C1E' },
        { name: 'app-bg', value: '#dbe8f4' },
      ],
    },
  },
};

export default preview;
