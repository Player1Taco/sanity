import {
  // eslint-disable-next-line no-restricted-imports
  Button as SanityUIButton,
  Flex,
  Stack,
  Text,
  useClickOutside,
} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {type CurrentUser, type PortableTextBlock, Translate, useTranslation} from 'sanity'
import styled from 'styled-components'

import {Button, Popover, Tooltip} from '../../../../ui-components'
import {commentsLocaleNamespace} from '../../i18n'
import {
  AddCommentIcon,
  CommentIcon,
  CommentInput,
  type CommentInputHandle,
  type CommentMessage,
  hasCommentMessageValue,
  type MentionOptionsHookValue,
} from '../../src'

const ContentStack = styled(Stack)`
  width: 320px;
`

interface CommentsFieldButtonProps {
  count: number
  currentUser: CurrentUser
  fieldTitle: string
  isRunningSetup: boolean
  mentionOptions: MentionOptionsHookValue
  onChange: (value: PortableTextBlock[]) => void
  onClick?: () => void
  onCommentAdd: () => void
  onDiscard: () => void
  onInputKeyDown?: (event: React.KeyboardEvent<Element>) => void
  open: boolean
  setOpen: (open: boolean) => void
  value: CommentMessage
}

export function CommentsFieldButton(props: CommentsFieldButtonProps) {
  const {
    count,
    currentUser,
    fieldTitle,
    isRunningSetup,
    mentionOptions,
    onChange,
    onClick,
    onCommentAdd,
    onDiscard,
    onInputKeyDown,
    open,
    setOpen,
    value,
  } = props
  const {t} = useTranslation(commentsLocaleNamespace)
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const [addCommentButtonElement, setAddCommentButtonElement] = useState<HTMLButtonElement | null>(
    null,
  )
  const commentInputHandle = useRef<CommentInputHandle | null>(null)
  const hasComments = Boolean(count > 0)

  const closePopover = useCallback(() => {
    if (!open) return
    setOpen(false)
    addCommentButtonElement?.focus()
  }, [addCommentButtonElement, open, setOpen])

  const handleSubmit = useCallback(() => {
    onCommentAdd()
    closePopover()
  }, [closePopover, onCommentAdd])

  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

  const startDiscard = useCallback(() => {
    if (!hasValue) {
      closePopover()
      return
    }

    commentInputHandle.current?.discardDialogController.open()
  }, [closePopover, hasValue])

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<Element>) => {
      // Don't act if the input already prevented this event
      if (event.isDefaultPrevented()) {
        return
      }

      // Call parent handler
      if (onInputKeyDown) onInputKeyDown(event)
    },
    [onInputKeyDown],
  )

  const handleDiscardCancel = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
  }, [])

  const handleDiscardConfirm = useCallback(() => {
    commentInputHandle.current?.discardDialogController.close()
    closePopover()
    onDiscard()
  }, [closePopover, onDiscard])

  const handlePopoverKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        startDiscard()
      }
    },
    [startDiscard],
  )

  const handleClickOutside = useCallback(() => {
    if (!open) return

    startDiscard()
  }, [open, startDiscard])

  useClickOutside(handleClickOutside, [popoverElement])

  if (!hasComments) {
    const placeholder = (
      <Translate
        t={t}
        i18nKey="compose.add-comment-input-placeholder"
        values={{field: fieldTitle}}
      />
    )

    const content = (
      <ContentStack padding={2} space={4}>
        <CommentInput
          currentUser={currentUser}
          focusLock
          focusOnMount
          mentionOptions={mentionOptions}
          onChange={onChange}
          onDiscardCancel={handleDiscardCancel}
          onDiscardConfirm={handleDiscardConfirm}
          onKeyDown={handleInputKeyDown}
          onSubmit={handleSubmit}
          placeholder={placeholder}
          readOnly={isRunningSetup}
          ref={commentInputHandle}
          value={value}
        />
      </ContentStack>
    )

    return (
      <Popover
        constrainSize
        content={content}
        fallbackPlacements={['bottom-end']}
        open={open}
        placement="right-start"
        portal
        ref={setPopoverElement}
        onKeyDown={handlePopoverKeyDown}
      >
        <div>
          <Button
            aria-label={t('field-button.aria-label-add')}
            disabled={isRunningSetup}
            icon={AddCommentIcon}
            mode="bleed"
            onClick={onClick}
            ref={setAddCommentButtonElement}
            selected={open}
            tooltipProps={{
              content: t('field-button.title'),
              placement: 'top',
            }}
          />
        </div>
      </Popover>
    )
  }

  return (
    <Tooltip portal placement="top" content={t('field-button.content', {count})}>
      <SanityUIButton
        aria-label={t('field-button.aria-label-open')}
        mode="bleed"
        onClick={onClick}
        padding={2}
        space={2}
      >
        <Flex align="center" gap={2}>
          <Text size={1}>
            <CommentIcon />
          </Text>
          <Text size={0}>{count > 9 ? '9+' : count}</Text>
        </Flex>
      </SanityUIButton>
    </Tooltip>
  )
}
