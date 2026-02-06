<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Avatar from './Avatar.svelte';

  const { Story } = defineMeta({
    title: 'UI/Avatar',
    component: Avatar,
    tags: ['autodocs'],
    argTypes: {
      size: {
        control: { type: 'select' },
        options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
        description: 'Avatar size'
      },
      src: {
        control: 'text',
        description: 'Image URL'
      },
      alt: {
        control: 'text',
        description: 'Alt text for the image'
      },
      name: {
        control: 'text',
        description: 'User name (used for initials fallback and gradient)'
      }
    }
  });
</script>

<Story name="With Image" args={{ src: 'https://i.pravatar.cc/150?u=avatar1', name: 'Maria Garcia' }} />

<Story name="Initials Only" args={{ name: 'Carlos Rodriguez' }} />

<Story name="Extra Small" args={{ size: 'xs', name: 'AB' }} />

<Story name="Small" args={{ size: 'sm', name: 'CD' }} />

<Story name="Medium" args={{ size: 'md', name: 'EF' }} />

<Story name="Large" args={{ size: 'lg', name: 'GH' }} />

<Story name="Extra Large" args={{ size: 'xl', name: 'IJ' }} />

<Story name="Size 2XL" args={{ size: '2xl', name: 'KL' }} />

<Story name="Size 3XL" args={{ size: '3xl', name: 'MN' }} />

<Story name="No Image No Name" args={{}} />
