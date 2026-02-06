<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DocumentListSkeleton from './DocumentListSkeleton.svelte';

  const { Story } = defineMeta({
    title: 'Documents/DocumentListSkeleton',
    component: DocumentListSkeleton,
    tags: ['autodocs'],
    argTypes: {
      count: {
        control: { type: 'number' },
        description: 'Number of skeleton items to display'
      }
    }
  });
</script>

<Story name="Default" />

<Story name="Three Items" args={{ count: 3 }} />

<Story name="Five Items" args={{ count: 5 }} />

<Story name="Single Item" args={{ count: 1 }} />

<Story name="Ten Items" args={{ count: 10 }} />
