import { InputSupport, InputTextOptions, InputTextResponse, INPUT_ACTIONS, MessageBoxResponse, MessageBoxOptions, SelectTextOptions, SelectTextResponse } from './types';

import axon = require('axon')

export function createConsumer(config: InputConsumerConfig): InputConsumer {
  return new InputConsumerImpl(config)
}

export interface InputConsumerConfig {
  log?: (msg: string) => void
  port: number
}

export interface InputConsumer {
  setLogger(log: (msg: string) => void): void

  hasSupport(feature: INPUT_ACTIONS): boolean
  /** emits action `askSupported` so provider can tell which kind of input request it support  */
  askSupported(): Promise<InputSupport>

  /** emits action `inputText` so provider execute its implementation (showing an input box). Returns a promise that it will be resolved with the user's input or undefined if user cancelled the operation. */
  inputText(options: InputTextOptions): Promise<InputTextResponse>
  messageBox(options: MessageBoxOptions): Promise<MessageBoxResponse> 
  selectText(options: SelectTextOptions): Promise<SelectTextResponse>
}

class InputConsumerImpl implements InputConsumer {

  private supports: InputSupport = {
    inputText: false,
    askSupported: false,
    messageBox: false, 
    selectText: false
  }
  private supportsSetted: boolean = false

  private sock: any

  constructor(private config: InputConsumerConfig) {
    this.config.log = this.config.log || console.log

    this.sock = axon.socket('req')

    this.sock.on('error', (e:any) => {
      this.config.log(`consumer error ${e}`)
    })
    this.sock.on('ignored error', (e:any) => {
      this.config.log(`consumer ignored error ${e}`)
    })
    this.sock.on('socket error', (e:any) => {
      this.config.log(`consumer socket error ${e}`)
    })
    this.sock.on('*', (e:any) => {
      this.config.log(`consumer * event * ${e}`)
    })

    this.sock.bind(this.config.port, '127.0.0.1')
    this.config.log(`consumer sock.bind finish at ${this.config.port}`)
  }

  hasSupport(feature: INPUT_ACTIONS): boolean {
    return this.supports[feature]
  }

  setLogger(log: (msg: string) => void): void {
    this.config.log = log
  }

  askSupported(): Promise<InputSupport> {
    if (this.supportsSetted) {
      return Promise.resolve(this.supports)
    }
    return new Promise(resolve => {
      this.config.log(`consumer requesting ${INPUT_ACTIONS.askSupported}`)
      this.sock.send(INPUT_ACTIONS.askSupported, {}, (res: InputSupport) => {
        this.config.log(`consumer got ${INPUT_ACTIONS.askSupported} response ${JSON.stringify(res)}`)
        this.supports = Object.assign({}, this.supports, res)
        this.supportsSetted = true
        resolve(this.supports)
      })
    })
  }

  inputText(options: InputTextOptions): Promise<InputTextResponse> {
    this.config.log(`consumer requesting ${INPUT_ACTIONS.inputText}`)
    return new Promise((resolve, reject) => {
      if (this.supports.inputText) {
        if(typeof options.validateInput !== 'string'){
          options.validateInput = options.validateInput.toString()
        }
        this.sock.send(INPUT_ACTIONS.inputText, options, (res: InputTextResponse) => {
          this.config.log(`consumer got ${INPUT_ACTIONS.inputText} response ${JSON.stringify(res)}`)
          resolve(res)
        })
      }
      else {
        reject()
      }
    })
  }

  messageBox(options: MessageBoxOptions): Promise<MessageBoxResponse> {
    this.config.log(`consumer requesting ${INPUT_ACTIONS.messageBox}`)
    return new Promise((resolve, reject) => {
      if (this.supports.messageBox) {
        this.sock.send(INPUT_ACTIONS.messageBox, options, (res: MessageBoxResponse) => {
          this.config.log(`consumer got ${INPUT_ACTIONS.messageBox} response ${JSON.stringify(res)}`)
          resolve(res)
        })
      }
      else {
        reject()
      }
    })
  }
  
  selectText(options: SelectTextOptions): Promise<SelectTextResponse> {
    this.config.log(`consumer requesting ${INPUT_ACTIONS.selectText}`)
    return new Promise((resolve, reject) => {
      if (this.supports.selectText) {
        this.sock.send(INPUT_ACTIONS.selectText, options, (res: SelectTextResponse) => {
          this.config.log(`consumer got ${INPUT_ACTIONS.selectText} response ${JSON.stringify(res)}`)
          resolve(res)
        })
      }
      else {
        reject()
      }
    })
  }
}