<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormSelect from './FormSelect.svelte';
  import { fn } from 'storybook/test';

  const mockOptions = [
    { value: 'factura', label: 'Factura' },
    { value: 'recibo', label: 'Recibo' },
    { value: 'presupuesto', label: 'Presupuesto' },
    { value: 'nota_credito', label: 'Nota de Crédito' },
  ];

  const { Story } = defineMeta({
    title: 'Forms/FormSelect',
    component: FormSelect,
    tags: ['autodocs'],
    argTypes: {
      label: { control: 'text', description: 'Label text for the select' },
      name: { control: 'text', description: 'Select name attribute' },
      value: { control: 'text', description: 'Currently selected value' },
      placeholder: { control: 'text', description: 'Placeholder text' },
      error: { control: 'text', description: 'Error message to display' },
      hint: { control: 'text', description: 'Hint text below the select' },
      disabled: { control: 'boolean', description: 'Whether the select is disabled' },
      required: { control: 'boolean', description: 'Whether the select is required' },
    },
    args: {
      onchange: fn(),
    },
  });
</script>

<Story
  name="Default"
  args={{
    label: 'Tipo de Documento',
    name: 'docType',
    options: mockOptions,
    placeholder: 'Selecciona un tipo',
  }}
/>

<Story
  name="With Value"
  args={{
    label: 'Tipo de Documento',
    name: 'docType',
    options: mockOptions,
    value: 'factura',
  }}
/>

<Story
  name="With Error"
  args={{
    label: 'Tipo de Documento',
    name: 'docType',
    options: mockOptions,
    error: 'Selecciona un tipo de documento',
  }}
/>

<Story
  name="Disabled"
  args={{
    label: 'Tipo de Documento',
    name: 'docType',
    options: mockOptions,
    disabled: true,
    value: 'factura',
  }}
/>

<Story
  name="Required"
  args={{
    label: 'Tipo de Documento',
    name: 'docType',
    options: mockOptions,
    required: true,
  }}
/>

<Story
  name="With Hint"
  args={{
    label: 'Tipo de Documento',
    name: 'docType',
    options: mockOptions,
    hint: 'Elige el tipo de documento a generar',
  }}
/>
