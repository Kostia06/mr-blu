<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Card from './Card.svelte';

  const { Story } = defineMeta({
    title: 'UI/Card',
    component: Card,
    tags: ['autodocs'],
    argTypes: {
      variant: {
        control: { type: 'select' },
        options: ['glass', 'solid', 'outline', 'gradient'],
        description: 'Card style variant'
      },
      padding: {
        control: { type: 'select' },
        options: ['none', 'sm', 'md', 'lg'],
        description: 'Internal padding'
      },
      hover: {
        control: 'boolean',
        description: 'Enable hover effects'
      },
      tiltEffect: {
        control: 'boolean',
        description: 'Enable 3D tilt effect on hover'
      }
    },
    parameters: {
      backgrounds: {
        default: 'dark'
      }
    }
  });
</script>

<Story name="Glass" args={{ variant: 'glass' }}>
  {#snippet children()}
    <h3 style="margin: 0 0 8px; color: white; font-weight: 600;">Glass Card</h3>
    <p style="margin: 0; color: rgba(255,255,255,0.7);">Beautiful frosted glass effect with blur.</p>
  {/snippet}
</Story>

<Story name="Solid" args={{ variant: 'solid' }}>
  {#snippet children()}
    <h3 style="margin: 0 0 8px; color: white; font-weight: 600;">Solid Card</h3>
    <p style="margin: 0; color: rgba(255,255,255,0.7);">Opaque background for content emphasis.</p>
  {/snippet}
</Story>

<Story name="Outline" args={{ variant: 'outline' }}>
  {#snippet children()}
    <h3 style="margin: 0 0 8px; color: white; font-weight: 600;">Outline Card</h3>
    <p style="margin: 0; color: rgba(255,255,255,0.7);">Minimal border-only style.</p>
  {/snippet}
</Story>

<Story name="Gradient" args={{ variant: 'gradient' }}>
  {#snippet children()}
    <h3 style="margin: 0 0 8px; color: white; font-weight: 600;">Gradient Card</h3>
    <p style="margin: 0; color: rgba(255,255,255,0.7);">Subtle gradient background.</p>
  {/snippet}
</Story>

<Story name="With Tilt Effect" args={{ variant: 'glass', tiltEffect: true }}>
  {#snippet children()}
    <h3 style="margin: 0 0 8px; color: white; font-weight: 600;">3D Tilt Card</h3>
    <p style="margin: 0; color: rgba(255,255,255,0.7);">Hover to see the 3D effect!</p>
  {/snippet}
</Story>

<Story name="No Hover" args={{ variant: 'glass', hover: false }}>
  {#snippet children()}
    <h3 style="margin: 0 0 8px; color: white; font-weight: 600;">Static Card</h3>
    <p style="margin: 0; color: rgba(255,255,255,0.7);">No hover effects applied.</p>
  {/snippet}
</Story>

<Story name="Large Padding" args={{ variant: 'glass', padding: 'lg' }}>
  {#snippet children()}
    <h3 style="margin: 0 0 8px; color: white; font-weight: 600;">Large Padding</h3>
    <p style="margin: 0; color: rgba(255,255,255,0.7);">More spacious interior.</p>
  {/snippet}
</Story>

<Story name="No Padding" args={{ variant: 'solid', padding: 'none' }}>
  {#snippet children()}
    <img src="https://picsum.photos/300/150" alt="Example" style="width: 100%; display: block; border-radius: 12px;" />
  {/snippet}
</Story>
