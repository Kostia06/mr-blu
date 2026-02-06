<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Badge from './Badge.svelte';

  const { Story } = defineMeta({
    title: 'UI/Badge',
    component: Badge,
    tags: ['autodocs'],
    argTypes: {
      status: {
        control: { type: 'select' },
        options: ['draft', 'sent', 'pending', 'paid', 'overdue', 'signed'],
        description: 'Document status'
      },
      variant: {
        control: { type: 'select' },
        options: ['default', 'outline', 'dot'],
        description: 'Badge style variant'
      },
      size: {
        control: { type: 'select' },
        options: ['sm', 'md'],
        description: 'Badge size'
      }
    }
  });
</script>

<Story name="Draft" args={{ status: 'draft' }} />

<Story name="Sent" args={{ status: 'sent' }} />

<Story name="Pending" args={{ status: 'pending' }} />

<Story name="Paid" args={{ status: 'paid' }} />

<Story name="Overdue" args={{ status: 'overdue' }} />

<Story name="Signed" args={{ status: 'signed' }} />

<Story name="Outline Variant" args={{ status: 'sent', variant: 'outline' }} />

<Story name="Dot Variant" args={{ status: 'paid', variant: 'dot' }} />

<Story name="Small Size" args={{ status: 'pending', size: 'sm' }} />

<Story name="Custom Content" args={{ variant: 'default' }}>
  {#snippet children()}
    Custom Label
  {/snippet}
</Story>

<Story name="All Statuses">
  <div style="display: flex; gap: 8px; flex-wrap: wrap; padding: 16px;">
    <Badge status="draft" />
    <Badge status="sent" />
    <Badge status="pending" />
    <Badge status="paid" />
    <Badge status="overdue" />
    <Badge status="signed" />
  </div>
</Story>
