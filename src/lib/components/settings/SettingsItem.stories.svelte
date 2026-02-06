<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SettingsItem from './SettingsItem.svelte';
  import { fn } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'Settings/SettingsItem',
    component: SettingsItem,
    tags: ['autodocs'],
    argTypes: {
      label: {
        control: { type: 'text' },
        description: 'Primary text label for the setting item'
      },
      value: {
        control: { type: 'text' },
        description: 'Secondary value text displayed below the label'
      },
      showArrow: {
        control: 'boolean',
        description: 'Whether to show a chevron arrow on the right'
      },
      destructive: {
        control: 'boolean',
        description: 'Applies destructive (red) styling for dangerous actions'
      },
      disabled: {
        control: 'boolean',
        description: 'Disables the item and reduces opacity'
      }
    },
    args: {
      onclick: fn()
    }
  });
</script>

<Story name="Default" args={{ label: 'Idioma', showArrow: true }} />

<Story name="With Value" args={{ label: 'Moneda', value: 'USD ($)', showArrow: true }} />

<Story name="Destructive" args={{ label: 'Cerrar Sesión', destructive: true }} />

<Story name="Disabled" args={{ label: 'Sincronización', value: 'No disponible', disabled: true }} />

<Story name="Without Arrow" args={{ label: 'Versión', value: '1.0.0' }} />
