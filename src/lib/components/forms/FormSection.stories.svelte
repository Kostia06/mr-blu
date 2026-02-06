<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormSection from './FormSection.svelte';

  const { Story } = defineMeta({
    title: 'Forms/FormSection',
    component: FormSection,
    tags: ['autodocs'],
    argTypes: {
      variant: {
        control: { type: 'select' },
        options: ['default', 'card', 'inline'],
        description: 'Section layout variant'
      },
      title: { control: 'text', description: 'Section heading' },
      description: { control: 'text', description: 'Section description text' },
      class: { control: 'text', description: 'Additional CSS classes' }
    }
  });
</script>

<Story name="Default" args={{ title: 'Información Personal', description: 'Datos básicos del usuario' }}>
  {#snippet children()}
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="height: 40px; background: #e5e7eb; border-radius: 8px;"></div>
      <div style="height: 40px; background: #e5e7eb; border-radius: 8px;"></div>
    </div>
  {/snippet}
</Story>

<Story name="Card" args={{ variant: 'card', title: 'Datos de Facturación', description: 'Información fiscal del negocio' }}>
  {#snippet children()}
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="height: 40px; background: #e5e7eb; border-radius: 8px;"></div>
      <div style="height: 40px; background: #e5e7eb; border-radius: 8px;"></div>
    </div>
  {/snippet}
</Story>

<Story name="Inline" args={{ variant: 'inline', title: 'Preferencias' }}>
  {#snippet children()}
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="height: 40px; background: #e5e7eb; border-radius: 8px;"></div>
      <div style="height: 40px; background: #e5e7eb; border-radius: 8px;"></div>
    </div>
  {/snippet}
</Story>

<Story name="Without Title">
  {#snippet children()}
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="height: 40px; background: #e5e7eb; border-radius: 8px;"></div>
      <div style="height: 40px; background: #e5e7eb; border-radius: 8px;"></div>
    </div>
  {/snippet}
</Story>
