<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormToggle from './FormToggle.svelte';
  import { fn } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'Forms/FormToggle',
    component: FormToggle,
    tags: ['autodocs'],
    argTypes: {
      variant: {
        control: { type: 'select' },
        options: ['default', 'card'],
        description: 'Visual style variant'
      },
      size: {
        control: { type: 'select' },
        options: ['sm', 'md'],
        description: 'Toggle size'
      },
      label: { control: 'text', description: 'Label text for the toggle' },
      description: { control: 'text', description: 'Optional description text' },
      name: { control: 'text', description: 'Input name attribute' },
      checked: { control: 'boolean', description: 'Whether the toggle is checked' },
      disabled: { control: 'boolean', description: 'Whether the toggle is disabled' }
    },
    args: {
      onchange: fn()
    }
  });
</script>

<Story
  name="Default"
  args={{
    label: 'Notificaciones por email',
    name: 'emailNotifs'
  }}
/>

<Story
  name="Card Variant"
  args={{
    variant: 'card',
    label: 'Recordatorios automáticos',
    description: 'Enviar recordatorios a clientes con pagos pendientes',
    name: 'autoReminders'
  }}
/>

<Story
  name="Small"
  args={{
    size: 'sm',
    label: 'Modo compacto',
    name: 'compact'
  }}
/>

<Story
  name="Checked"
  args={{
    label: 'Facturación automática',
    name: 'autoBilling',
    checked: true
  }}
/>

<Story
  name="Disabled"
  args={{
    label: 'Función premium',
    name: 'premium',
    disabled: true
  }}
/>

<Story
  name="Disabled Checked"
  args={{
    label: 'Configuración del sistema',
    name: 'system',
    disabled: true,
    checked: true
  }}
/>
