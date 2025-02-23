import {SearchIcon, SpinnerIcon} from '@sanity/icons'
import {Box, Card, Code, TextInput} from '@sanity/ui'
import {isEqual} from 'lodash'
import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useObservableCallback} from 'react-rx'
import {debounce, map, type Observable, of, tap, timer} from 'rxjs'
import {
  type GeneralPreviewLayoutKey,
  SourceProvider,
  useI18nText,
  useSchema,
  useSource,
  useTranslation,
  useUnique,
} from 'sanity'
import shallowEquals from 'shallow-equals'
import styled, {keyframes} from 'styled-components'

import {Pane} from '../../components/pane'
import {_DEBUG} from '../../constants'
import {structureLocaleNamespace} from '../../i18n'
import {type PaneMenuItem} from '../../types'
import {useStructureToolSetting} from '../../useStructureToolSetting'
import {type BaseStructureToolPaneProps} from '../types'
import {DEFAULT_ORDERING, EMPTY_RECORD} from './constants'
import {DocumentListPaneContent} from './DocumentListPaneContent'
import {DocumentListPaneHeader} from './DocumentListPaneHeader'
import {
  applyOrderingFunctions,
  getTypeNameFromSingleTypeFilter,
  isSimpleTypeFilter,
} from './helpers'
import {type LoadingVariant, type SortOrder} from './types'
import {useDocumentList} from './useDocumentList'

/**
 * @internal
 */
export type DocumentListPaneProps = BaseStructureToolPaneProps<'documentList'>

const EMPTY_ARRAY: never[] = []

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const AnimatedSpinnerIcon = styled(SpinnerIcon)`
  animation: ${rotate} 500ms linear infinite;
`

function useShallowUnique<ValueType>(value: ValueType): ValueType {
  const valueRef = useRef<ValueType>(value)
  if (!shallowEquals(valueRef.current, value)) {
    valueRef.current = value
  }
  return valueRef.current
}

const addSelectedStateToMenuItems = (options: {
  menuItems?: PaneMenuItem[]
  sortOrderRaw?: SortOrder
  layout?: GeneralPreviewLayoutKey
}) => {
  const {menuItems, sortOrderRaw, layout} = options

  return menuItems?.map((item) => {
    if (item.params?.layout) {
      return {
        ...item,
        selected: layout === item.params?.layout,
      }
    }

    if (item?.params?.by) {
      return {
        ...item,
        selected: isEqual(sortOrderRaw?.by, item?.params?.by || EMPTY_ARRAY),
      }
    }

    return {...item, selected: false}
  })
}

/**
 * @internal
 */
export const DocumentListPane = memo(function DocumentListPane(props: DocumentListPaneProps) {
  const {childItemId, index, isActive, isSelected, pane, paneKey} = props
  const schema = useSchema()
  const {name: parentSourceName} = useSource()

  const {
    defaultLayout = 'default',
    displayOptions,
    initialValueTemplates = EMPTY_ARRAY,
    menuItemGroups,
    menuItems,
    options,
  } = pane
  const {apiVersion, defaultOrdering = EMPTY_ARRAY, filter} = options
  const params = useShallowUnique(options.params || EMPTY_RECORD)
  const sourceName = pane.source
  const typeName = useMemo(() => getTypeNameFromSingleTypeFilter(filter, params), [filter, params])
  const showIcons = displayOptions?.showIcons !== false
  const [layout, setLayout] = useStructureToolSetting<GeneralPreviewLayoutKey>(
    typeName,
    'layout',
    defaultLayout,
  )

  const {t} = useTranslation(structureLocaleNamespace)
  const {title} = useI18nText(pane)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInputValue, setSearchInputValue] = useState<string>('')
  const [searchInputElement, setSearchInputElement] = useState<HTMLInputElement | null>(null)

  // A ref to determine if we should show the loading spinner in the search input.
  // This is used to avoid showing the spinner on initial load of the document list.
  // We only wan't to show the spinner when the user interacts with the search input.
  const showSearchLoadingRef = useRef<boolean>(false)

  // Ensure that we use the defaultOrdering value from structure builder if any as the default
  const defaultSortOrder = useMemo(() => {
    return defaultOrdering?.length > 0 ? {by: defaultOrdering} : DEFAULT_ORDERING
  }, [defaultOrdering])

  const [sortOrderRaw, setSortOrder] = useStructureToolSetting<SortOrder>(
    typeName,
    'sortOrder',
    defaultSortOrder,
  )

  const sortWithOrderingFn =
    typeName && sortOrderRaw
      ? applyOrderingFunctions(sortOrderRaw, schema.get(typeName) as any)
      : sortOrderRaw

  const sortOrder = useUnique(sortWithOrderingFn)
  const filterIsSimpleTypeConstraint = isSimpleTypeFilter(filter)

  const {
    error,
    hasMaxItems,
    isLazyLoading,
    isLoading,
    isSearchReady,
    items,
    onListChange,
    onRetry,
  } = useDocumentList({
    apiVersion,
    filter,
    params,
    searchQuery: searchQuery?.trim(),
    sortOrder,
  })

  const menuItemsWithSelectedState = useMemo(
    () =>
      addSelectedStateToMenuItems({
        menuItems,
        sortOrderRaw,
        layout,
      }),
    [layout, menuItems, sortOrderRaw],
  )

  const handleQueryChange = useObservableCallback(
    (event$: Observable<React.ChangeEvent<HTMLInputElement>>) => {
      return event$.pipe(
        map((event) => event.target.value),
        tap(setSearchInputValue),
        debounce((value) => (value === '' ? of('') : timer(300))),
        tap(setSearchQuery),
      )
    },
    [],
  )

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchInputValue('')
  }, [])

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        handleClearSearch()
      }
    },
    [handleClearSearch],
  )

  useEffect(() => {
    if (showSearchLoadingRef.current === false && !isLoading) {
      showSearchLoadingRef.current = true
    }

    return () => {
      showSearchLoadingRef.current = false
    }
  }, [isLoading])

  useEffect(() => {
    // Clear search field and reset showSearchLoadingRef ref
    // when switching between panes (i.e. when paneKey changes).
    handleClearSearch()
    showSearchLoadingRef.current = false
  }, [paneKey, handleClearSearch])

  const loadingVariant: LoadingVariant = useMemo(() => {
    const showSpinner = isLoading && items.length === 0 && showSearchLoadingRef.current

    if (showSpinner) return 'spinner'

    return 'initial'
  }, [isLoading, items.length])

  const searchInput = (
    <Box paddingX={3} paddingBottom={3}>
      <TextInput
        aria-label={t('panes.document-list-pane.search-input.aria-label')}
        autoComplete="off"
        border={false}
        clearButton={Boolean(searchQuery)}
        disabled={!isSearchReady}
        fontSize={[2, 2, 1]}
        icon={loadingVariant === 'spinner' ? AnimatedSpinnerIcon : SearchIcon}
        onChange={handleQueryChange}
        onClear={handleClearSearch}
        onKeyDown={handleSearchKeyDown}
        padding={2}
        placeholder={t('panes.document-list-pane.search-input.placeholder')}
        radius={2}
        ref={setSearchInputElement}
        spellCheck={false}
        value={searchInputValue}
      />
    </Box>
  )

  return (
    <SourceProvider name={sourceName || parentSourceName}>
      <Pane
        currentMaxWidth={350}
        data-ui="DocumentListPane"
        id={paneKey}
        maxWidth={640}
        minWidth={320}
        selected={isSelected}
      >
        {_DEBUG && (
          <Card padding={4} tone="transparent">
            <Code>{pane.source || '(none)'}</Code>
          </Card>
        )}

        <DocumentListPaneHeader
          contentAfter={searchInput}
          index={index}
          initialValueTemplates={initialValueTemplates}
          menuItemGroups={menuItemGroups}
          menuItems={menuItemsWithSelectedState}
          setLayout={setLayout}
          setSortOrder={setSortOrder}
          title={title}
        />

        <DocumentListPaneContent
          childItemId={childItemId}
          error={error}
          filterIsSimpleTypeConstraint={filterIsSimpleTypeConstraint}
          hasMaxItems={hasMaxItems}
          hasSearchQuery={Boolean(searchQuery)}
          isActive={isActive}
          isLazyLoading={isLazyLoading}
          isLoading={isLoading}
          items={items}
          key={paneKey}
          layout={layout}
          loadingVariant={loadingVariant}
          onListChange={onListChange}
          onRetry={onRetry}
          paneTitle={title}
          searchInputElement={searchInputElement}
          showIcons={showIcons}
        />
      </Pane>
    </SourceProvider>
  )
})
