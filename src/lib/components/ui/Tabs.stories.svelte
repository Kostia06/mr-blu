<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Tabs from './Tabs.svelte';
  import { fn } from 'storybook/test';

  const mockTabs = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendientes', badge: 3 },
    { id: 'paid', label: 'Pagadas' },
    { id: 'overdue', label: 'Vencidas', badge: 1 },
  ];

  const { Story } = defineMeta({
    title: 'UI/Tabs',
    component: Tabs,
    tags: ['autodocs'],
    argTypes: {
      variant: {
        control: { type: 'select' },
        options: ['underline', 'pills', 'cards'],
        description: 'Tab style variant'
      },
      size: {
        control: { type: 'select' },
        options: ['sm', 'md'],
        description: 'Tab size'
      },
      fullWidth: {
        control: 'boolean',
        description: 'Stretch tabs to fill container width'
      },
      activeTab: {
        control: { type: 'select' },
        options: ['all', 'pending', 'paid', 'overdue'],
        description: 'Currently active tab ID'
      }
    },
    args: {
      onchange: fn()
    }
  });
</script>

<Story name="Underline" args={{ variant: 'underline', tabs: mockTabs, activeTab: 'all' }} />

<Story name="Pills" args={{ variant: 'pills', tabs: mockTabs, activeTab: 'pending' }} />

<Story name="Cards" args={{ variant: 'cards', tabs: mockTabs, activeTab: 'all' }} />

<Story name="Small Size" args={{ variant: 'underline', size: 'sm', tabs: mockTabs }} />

<Story name="Full Width" args={{ variant: 'underline', fullWidth: true, tabs: mockTabs }} />
