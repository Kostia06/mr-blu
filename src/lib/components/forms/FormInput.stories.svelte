<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormInput from './FormInput.svelte';
  import { fn } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'Forms/FormInput',
    component: FormInput,
    tags: ['autodocs'],
    argTypes: {
      variant: {
        control: { type: 'select' },
        options: ['default', 'floating'],
        description: 'Input style variant'
      },
      type: {
        control: { type: 'select' },
        options: ['text', 'email', 'tel', 'number', 'password', 'date', 'url'],
        description: 'HTML input type'
      },
      label: { control: 'text', description: 'Label text for the input' },
      name: { control: 'text', description: 'Input name attribute' },
      value: { control: 'text', description: 'Current input value' },
      placeholder: { control: 'text', description: 'Placeholder text' },
      error: { control: 'text', description: 'Error message to display' },
      hint: { control: 'text', description: 'Hint text below the input' },
      disabled: { control: 'boolean', description: 'Whether the input is disabled' },
      required: { control: 'boolean', description: 'Whether the input is required' },
      success: { control: 'boolean', description: 'Whether to show success state' }
    },
    args: {
      oninput: fn(),
      onchange: fn(),
      onblur: fn()
    }
  });
</script>

<Story
  name="Default"
  args={{
    label: 'Nombre',
    name: 'name',
    placeholder: 'Ingresa tu nombre'
  }}
/>

<Story
  name="Floating Label"
  args={{
    variant: 'floating',
    label: 'Email',
    name: 'email',
    type: 'email',
    placeholder: 'correo@ejemplo.com'
  }}
/>

<Story
  name="With Error"
  args={{
    label: 'Email',
    name: 'email',
    error: 'El email no es válido',
    value: 'invalid-email'
  }}
/>

<Story
  name="Success"
  args={{
    label: 'Email',
    name: 'email',
    success: true,
    value: 'correo@ejemplo.com'
  }}
/>

<Story
  name="Disabled"
  args={{
    label: 'Nombre',
    name: 'name',
    disabled: true,
    value: 'Juan Pérez'
  }}
/>

<Story
  name="With Hint"
  args={{
    label: 'Contraseña',
    name: 'password',
    type: 'password',
    hint: 'Mínimo 8 caracteres'
  }}
/>

<Story
  name="Required"
  args={{
    label: 'Nombre Completo',
    name: 'fullname',
    required: true
  }}
/>
