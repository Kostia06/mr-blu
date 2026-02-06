<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import RecordButtonMobile from './RecordButtonMobile.svelte';
  import { fn } from 'storybook/test';

  const { Story } = defineMeta({
    title: 'Components/RecordButtonMobile',
    component: RecordButtonMobile,
    tags: ['autodocs'],
    argTypes: {
      isRecording: {
        control: 'boolean',
        description: 'Whether the button is in recording state'
      },
      isPaused: {
        control: 'boolean',
        description: 'Whether the recording is paused'
      },
      isDisabled: {
        control: 'boolean',
        description: 'Whether the button is disabled'
      },
      audioLevel: {
        control: { type: 'range', min: 0, max: 1, step: 0.01 },
        description: 'Current audio input level (0 to 1)'
      }
    },
    args: {
      onclick: fn()
    }
  });
</script>

<Story name="Idle" />

<Story name="Recording" args={{ isRecording: true, audioLevel: 0.6 }} />

<Story name="Paused" args={{ isRecording: true, isPaused: true }} />

<Story name="Disabled" args={{ isDisabled: true }} />

<Story name="High Audio Level" args={{ isRecording: true, audioLevel: 0.95 }} />

<Story name="Low Audio Level" args={{ isRecording: true, audioLevel: 0.15 }} />
