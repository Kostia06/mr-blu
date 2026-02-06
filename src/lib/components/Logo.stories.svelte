<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Logo from './Logo.svelte';

  const { Story } = defineMeta({
    title: 'Components/Logo',
    component: Logo,
    tags: ['autodocs'],
    argTypes: {
      size: {
        control: { type: 'select' },
        options: ['xs', 'sm', 'md', 'lg', 'xl'],
        description: 'Logo size'
      },
      variant: {
        control: { type: 'select' },
        options: ['full', 'icon', 'detailed'],
        description: 'Logo variant'
      },
      showText: {
        control: 'boolean',
        description: 'Whether to show text alongside the logo'
      }
    }
  });
</script>

<Story name="Default" />

<Story name="Extra Small" args={{ size: 'xs' }} />

<Story name="Small" args={{ size: 'sm' }} />

<Story name="Medium" args={{ size: 'md' }} />

<Story name="Large" args={{ size: 'lg' }} />

<Story name="Extra Large" args={{ size: 'xl' }} />

<Story name="Icon Only" args={{ variant: 'icon' }} />

<Story name="Detailed" args={{ variant: 'detailed' }} />

<Story name="Without Text" args={{ showText: false }} />
