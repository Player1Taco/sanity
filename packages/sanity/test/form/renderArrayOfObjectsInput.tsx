import {type ArraySchemaType, type FieldDefinition} from '@sanity/types'
import type * as React from 'react'

import {
  type ArrayOfObjectsFormNode,
  type ArrayOfObjectsInputProps,
  type ComplexElementProps,
  defaultRenderAnnotation,
  defaultRenderBlock,
  defaultRenderField,
  defaultRenderInlineBlock,
  defaultRenderInput,
  defaultRenderItem,
  defaultRenderPreview,
  type FieldMember,
} from '../../src/core'
import {renderInput, type TestRenderInputContext, type TestRenderInputProps} from './renderInput'
import {type TestRenderProps} from './types'

const noopRenderDefault = () => <></>

export type TestRenderArrayOfObjectInputCallback = (
  inputProps: ArrayOfObjectsInputProps,
) => React.ReactElement

export async function renderArrayOfObjectsInput(options: {
  fieldDefinition: FieldDefinition<'array'>
  props?: TestRenderProps
  render: TestRenderArrayOfObjectInputCallback
}) {
  const {fieldDefinition, props, render} = options

  const onItemAppend = jest.fn()
  const onItemClose = jest.fn()
  const onCollapse = jest.fn()
  const onItemCollapse = jest.fn()
  const onExpand = jest.fn()
  const onItemExpand = jest.fn()
  const onPathFocus = jest.fn()
  const onInsert = jest.fn()
  const onItemMove = jest.fn()
  const onItemOpen = jest.fn()
  const onItemPrepend = jest.fn()
  const onUpload = jest.fn()
  const onItemRemove = jest.fn()

  let initialValueId = 0
  const resolveInitialValue = () => Promise.resolve({_key: String(initialValueId++)})

  function transformProps(
    baseProps: TestRenderInputProps<ComplexElementProps>,
    context: TestRenderInputContext,
  ): ArrayOfObjectsInputProps {
    const {focusPath, path, schemaType, value, ...restProps} = baseProps
    const {formState} = context
    const fieldMember = formState.members?.find(
      (member) => member.kind === 'field' && member.name === fieldDefinition.name,
    ) as FieldMember<ArrayOfObjectsFormNode> | undefined
    const field = fieldMember?.field

    return {
      ...restProps,
      changed: false,
      focusPath,
      members: field?.members || [],
      onItemAppend,
      onItemClose,
      onItemCollapse,
      onItemExpand,
      onPathFocus,
      onInsert,
      onItemMove,
      onItemOpen,
      onItemPrepend,
      onItemRemove,
      resolveUploader: () => null,
      onUpload,
      path,
      renderAnnotation: defaultRenderAnnotation,
      renderBlock: defaultRenderBlock,
      renderField: defaultRenderField,
      renderInlineBlock: defaultRenderInlineBlock,
      renderInput: defaultRenderInput,
      renderItem: defaultRenderItem,
      renderPreview: defaultRenderPreview,
      resolveInitialValue,
      schemaType: schemaType as ArraySchemaType,
      value: value as any[],
      renderDefault: noopRenderDefault,
    }
  }

  const ret = await renderInput({
    fieldDefinition,
    props,
    render: (inputProps, context) => render(transformProps(inputProps, context)),
  })

  function rerender(renderFn: TestRenderArrayOfObjectInputCallback) {
    return ret.rerender((inputProps, context) => renderFn(transformProps(inputProps, context)))
  }

  return {...ret, onItemAppend, rerender}
}
