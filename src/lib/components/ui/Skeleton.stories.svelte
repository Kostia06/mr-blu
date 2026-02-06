<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Skeleton from './Skeleton.svelte';

  const { Story } = defineMeta({
    title: 'UI/Skeleton',
    component: Skeleton,
    tags: ['autodocs'],
    argTypes: {
      variant: {
        control: { type: 'select' },
        options: ['text', 'circle', 'rect', 'card'],
        description: 'Skeleton shape variant'
      },
      width: {
        control: 'text',
        description: 'Custom width (CSS value)'
      },
      height: {
        control: 'text',
        description: 'Custom height (CSS value)'
      },
      class: {
        control: 'text',
        description: 'Additional CSS classes'
      }
    }
  });
</script>

<Story name="Text" args={{ variant: 'text' }} />

<Story name="Circle" args={{ variant: 'circle', width: '48px', height: '48px' }} />

<Story name="Rectangle" args={{ variant: 'rect', width: '200px', height: '120px' }} />

<Story name="Card" args={{ variant: 'card' }} />

<Story name="Custom Size" args={{ variant: 'text', width: '300px', height: '24px' }} />
