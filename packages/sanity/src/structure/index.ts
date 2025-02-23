export {DocumentInspectorHeader} from './panes/document/documentInspector'
export * from './structureTool'

// Export `DocumentPaneProvider`
export type {
  BackLinkProps,
  ChildLinkProps,
  ConfirmDeleteDialogProps,
  EditReferenceOptions,
  PaneRouterContextValue,
  ParameterizedLinkProps,
  ReferenceChildLinkProps,
} from './components'
export {ConfirmDeleteDialog, PaneLayout, PaneRouterContext, usePaneRouter} from './components'
export {structureLocaleNamespace, type StructureLocaleResourceKeys} from './i18n'
export * from './panes/document'
export {type DocumentPaneProviderProps} from './panes/document/types'
export * from './panes/document/useDocumentPane'
export * from './panes/documentList'
export * from './structureBuilder'
export * from './StructureToolProvider'
export * from './types'
export * from './useStructureTool'
