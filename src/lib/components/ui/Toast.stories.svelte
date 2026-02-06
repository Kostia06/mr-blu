<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Toast from './Toast.svelte';
  import { fn } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'UI/Toast',
    component: Toast,
    tags: ['autodocs'],
    argTypes: {
      toasts: {
        description: 'Array de notificaciones toast a mostrar'
      },
      onDismiss: {
        description: 'Callback al cerrar una notificacion'
      }
    },
    args: {
      onDismiss: fn()
    },
    parameters: {
      backgrounds: {
        default: 'dark'
      }
    }
  });
</script>

<Story
  name="Success"
  args={{
    toasts: [
      { id: '1', type: 'success', message: 'Factura enviada correctamente al cliente.' }
    ]
  }}
/>

<Story
  name="Error"
  args={{
    toasts: [
      { id: '2', type: 'error', message: 'No se pudo guardar el documento. Intenta de nuevo.' }
    ]
  }}
/>

<Story
  name="Info"
  args={{
    toasts: [
      { id: '3', type: 'info', message: 'Tu suscripcion se renovara el 15 de marzo.' }
    ]
  }}
/>

<Story
  name="Warning"
  args={{
    toasts: [
      { id: '4', type: 'warning', message: 'La factura vence en 3 dias. Recuerda enviarla.' }
    ]
  }}
/>

<Story
  name="Multiple Toasts"
  args={{
    toasts: [
      { id: '1', type: 'success', message: 'Documento firmado exitosamente.' },
      { id: '2', type: 'error', message: 'Error al conectar con el servidor de pagos.' },
      { id: '3', type: 'info', message: 'Se ha actualizado la informacion del cliente.' },
      { id: '4', type: 'warning', message: 'Tienes 5 facturas pendientes por cobrar.' }
    ]
  }}
/>
