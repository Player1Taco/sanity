import {supportsLocalStorage} from '../../../../util/supportsLocalStorage'
import {localStorageBackend} from './localStorage'
import {memoryBackend} from './memory'
import {type Backend} from './types'

export function resolveBackend(): Backend {
  return supportsLocalStorage ? localStorageBackend : memoryBackend
}
