import {
  type Path,
  type Reference,
  type ReferenceFilterSearchOptions,
  type ReferenceOptions,
  type ReferenceSchemaType,
  type SanityDocument,
} from '@sanity/types'
import * as PathUtils from '@sanity/util/paths'
import {
  type ComponentProps,
  type ForwardedRef,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
} from 'react'
import {from, throwError} from 'rxjs'
import {catchError, mergeMap} from 'rxjs/operators'

import {type Source} from '../../../config'
import {type FIXME} from '../../../FIXME'
import {useSchema} from '../../../hooks'
import {useDocumentPreviewStore} from '../../../store'
import {useSource} from '../../../studio'
import {useSearchMaxFieldDepth} from '../../../studio/components/navbar/search/hooks/useSearchMaxFieldDepth'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'
import {isNonNullable} from '../../../util'
import {useFormValue} from '../../contexts/FormValue'
import {useReferenceInputOptions} from '../../studio'
import * as adapter from '../../studio/inputs/client-adapters/reference'
import {type EditReferenceEvent} from './types'

function useValueRef<T>(value: T): {current: T} {
  const ref = useRef(value)
  ref.current = value
  return ref
}

interface SearchError {
  message: string
  details?: {
    type: string
    description: string
  }
}

// eslint-disable-next-line require-await
async function resolveUserDefinedFilter(
  options: ReferenceOptions | undefined,
  document: SanityDocument,
  valuePath: Path,
  getClient: Source['getClient'],
): Promise<ReferenceFilterSearchOptions> {
  if (!options) {
    return {}
  }

  if (typeof options.filter === 'function') {
    const parentPath = valuePath.slice(0, -1)
    const parent = PathUtils.get(document, parentPath) as Record<string, unknown>
    return options.filter({document, parentPath, parent, getClient})
  }

  return {
    filter: options.filter,
    params: 'filterParams' in options ? options.filterParams : undefined,
  }
}

interface Options {
  path: Path
  schemaType: ReferenceSchemaType
  value?: Reference
}

export function useReferenceInput(options: Options) {
  const {path, schemaType} = options
  const source = useSource()
  const client = source.getClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const schema = useSchema()
  const documentPreviewStore = useDocumentPreviewStore()
  const maxFieldDepth = useSearchMaxFieldDepth()
  const searchClient = useMemo(() => client.withConfig({apiVersion: '2021-03-25'}), [client])
  const {EditReferenceLinkComponent, onEditReference, activePath, initialValueTemplateItems} =
    useReferenceInputOptions()

  const documentValue = useFormValue([]) as FIXME
  const documentRef = useValueRef(documentValue)

  const documentTypeName = documentRef.current?._type

  const isCurrentDocumentLiveEdit = useMemo(() => {
    return schema.get(documentTypeName)?.liveEdit
  }, [documentTypeName, schema])

  const disableNew = schemaType.options?.disableNew === true
  const getClient = source.getClient

  const handleSearch = useCallback(
    (searchString: string) =>
      from(resolveUserDefinedFilter(schemaType.options, documentRef.current, path, getClient)).pipe(
        mergeMap(({filter, params}) =>
          adapter.referenceSearch(searchClient, searchString, schemaType, {
            ...schemaType.options,
            filter,
            params,
            tag: 'search.reference',
            maxFieldDepth,
          }),
        ),

        catchError((err: SearchError) => {
          const isQueryError = err.details && err.details.type === 'queryParseError'
          if (schemaType.options?.filter && isQueryError) {
            err.message = `Invalid reference filter, please check the custom "filter" option`
          }
          return throwError(err)
        }),
      ),

    [documentRef, path, searchClient, schemaType, maxFieldDepth, getClient],
  )

  const template = options.value?._strengthenOnPublish?.template
  const EditReferenceLink = useMemo(
    () =>
      forwardRef(function EditReferenceLink_(
        _props: ComponentProps<NonNullable<typeof EditReferenceLinkComponent>>,
        forwardedRef: ForwardedRef<'a'>,
      ) {
        return EditReferenceLinkComponent ? (
          <EditReferenceLinkComponent
            {..._props}
            ref={forwardedRef}
            parentRefPath={path}
            template={template}
          />
        ) : null
      }),
    [EditReferenceLinkComponent, path, template],
  )

  const handleEditReference = useCallback(
    (event: EditReferenceEvent) => {
      onEditReference?.({
        parentRefPath: path,
        id: event.id,
        type: event.type,
        template: event.template,
      })
    },
    [onEditReference, path],
  )

  const selectedState = PathUtils.startsWith(path, activePath?.path || [])
    ? activePath?.state
    : 'none'

  const createOptions = useMemo(() => {
    if (disableNew) {
      return []
    }
    return (
      (initialValueTemplateItems || [])
        // eslint-disable-next-line max-nested-callbacks
        .filter((i) => schemaType.to.some((refType) => refType.name === i.template?.schemaType))
        .map((item) =>
          item.template?.schemaType
            ? {
                id: item.id,
                title:
                  item.title || `${item.template.schemaType} from template ${item.template.id}`,
                type: item.template.schemaType,
                icon: item.icon,
                template: {
                  id: item.template.id,
                  params: item.parameters,
                },

                permission: {granted: item.granted, reason: item.reason},
              }
            : undefined,
        )
        .filter(isNonNullable)
    )
  }, [disableNew, initialValueTemplateItems, schemaType.to])

  const getReferenceInfo = useCallback(
    (id: string) => adapter.getReferenceInfo(documentPreviewStore, id, schemaType),
    [documentPreviewStore, schemaType],
  )

  return {
    selectedState,
    handleSearch,
    isCurrentDocumentLiveEdit,
    handleEditReference,
    EditReferenceLink,
    createOptions,
    getReferenceInfo,
  }
}
