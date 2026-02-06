<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import StatsCard from './StatsCard.svelte';

  const { Story } = defineMeta({
    title: 'Dashboard/StatsCard',
    component: StatsCard,
    tags: ['autodocs'],
    argTypes: {
      format: {
        control: { type: 'select' },
        options: ['currency', 'number'],
        description: 'Display format for the value'
      },
      value: {
        control: { type: 'number' },
        description: 'Numeric value to display'
      },
      trend: {
        control: { type: 'number' },
        description: 'Trend percentage (positive or negative)'
      }
    }
  });
</script>

<Story
  name="Currency Format"
  args={{ title: 'Ingresos del Mes', value: 45230, format: 'currency' }}
/>

<Story
  name="Number Format"
  args={{ title: 'Documentos Enviados', value: 127, format: 'number' }}
/>

<Story
  name="With Positive Trend"
  args={{ title: 'Ingresos del Mes', value: 45230, format: 'currency', trend: 12.5 }}
/>

<Story
  name="With Negative Trend"
  args={{ title: 'Gastos del Mes', value: 18500, format: 'currency', trend: -8.3 }}
/>

<Story
  name="Zero Value"
  args={{ title: 'Facturas Pendientes', value: 0, format: 'number' }}
/>
