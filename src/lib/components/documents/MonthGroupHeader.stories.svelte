<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import MonthGroupHeader from './MonthGroupHeader.svelte';

  const { Story } = defineMeta({
    title: 'Documents/MonthGroupHeader',
    component: MonthGroupHeader,
    tags: ['autodocs'],
    argTypes: {
      month: {
        control: { type: 'text' },
        description: 'Month label displayed in the header'
      },
      count: {
        control: { type: 'number' },
        description: 'Number of documents in this month group'
      }
    }
  });
</script>

<Story name="Default" args={{ month: 'Enero 2025', count: 12 }} />

<Story name="Single Document" args={{ month: 'Febrero 2025', count: 1 }} />

<Story name="Many Documents" args={{ month: 'Marzo 2025', count: 47 }} />

<Story name="Current Month" args={{ month: 'Diciembre 2025', count: 5 }} />
