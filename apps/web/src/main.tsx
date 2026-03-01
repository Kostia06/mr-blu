import { render } from 'preact'
import { App } from './app'
import { initializeNative } from './lib/native'
import './styles/globals.css'

initializeNative()

render(<App />, document.getElementById('app')!)
