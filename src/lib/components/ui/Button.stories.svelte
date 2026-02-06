<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from './Button.svelte';
  import { fn } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'UI/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
      variant: {
        control: { type: 'select' },
        options: ['primary', 'secondary', 'ghost', 'outline'],
        description: 'Visual style variant'
      },
      size: {
        control: { type: 'select' },
        options: ['sm', 'md', 'lg'],
        description: 'Button size'
      },
      disabled: { control: 'boolean' },
      loading: { control: 'boolean' },
      pulse: { control: 'boolean', description: 'Adds a pulsing glow effect' }
    },
    args: {
      onclick: fn()
    }
  });
</script>

<Story name="Primary" args={{ variant: 'primary' }}>
  {#snippet children()}
    Comenzar Gratis
  {/snippet}
</Story>

<Story name="Secondary" args={{ variant: 'secondary' }}>
  {#snippet children()}
    Ver Demo
  {/snippet}
</Story>

<Story name="Ghost" args={{ variant: 'ghost' }}>
  {#snippet children()}
    Cancelar
  {/snippet}
</Story>

<Story name="Outline" args={{ variant: 'outline' }}>
  {#snippet children()}
    Editar
  {/snippet}
</Story>

<Story name="Small" args={{ variant: 'primary', size: 'sm' }}>
  {#snippet children()}
    Guardar
  {/snippet}
</Story>

<Story name="Large" args={{ variant: 'primary', size: 'lg' }}>
  {#snippet children()}
    Enviar Factura
  {/snippet}
</Story>

<Story name="Loading" args={{ variant: 'primary', loading: true }}>
  {#snippet children()}
    Enviando...
  {/snippet}
</Story>

<Story name="Disabled" args={{ variant: 'primary', disabled: true }}>
  {#snippet children()}
    No disponible
  {/snippet}
</Story>

<Story name="With Pulse" args={{ variant: 'primary', pulse: true }}>
  {#snippet children()}
    Acci&oacute;n Importante
  {/snippet}
</Story>

<Story name="As Link" args={{ variant: 'primary', href: '/dashboard' }}>
  {#snippet children()}
    Ir al Dashboard
  {/snippet}
</Story>
