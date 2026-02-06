<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SettingsSection from './SettingsSection.svelte';

  const { Story } = defineMeta({
    title: 'Settings/SettingsSection',
    component: SettingsSection,
    tags: ['autodocs'],
    argTypes: {
      title: { control: 'text', description: 'Section heading displayed above the items' },
      class: { control: 'text', description: 'Additional CSS classes' }
    }
  });
</script>

<Story name="With Title" args={{ title: 'General' }}>
  {#snippet children()}
    <div style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Idioma</div>
    <div style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Moneda</div>
    <div style="padding: 12px 16px;">Zona Horaria</div>
  {/snippet}
</Story>

<Story name="Without Title">
  {#snippet children()}
    <div style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Opción A</div>
    <div style="padding: 12px 16px;">Opción B</div>
  {/snippet}
</Story>
