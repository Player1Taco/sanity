import {Badge, Box, Card, Flex, Text, TextSkeleton} from '@sanity/ui'
import type * as React from 'react'
import {useCallback} from 'react'
import {useTranslation, useUser} from 'sanity'
import styled from 'styled-components'

import {commentsLocaleNamespace} from '../../../i18n'
import {type MentionOptionUser} from '../../types'
import {CommentsAvatar} from '../avatars'

const InnerFlex = styled(Flex)``

const SKELETON_INLINE_STYLE: React.CSSProperties = {width: '50%'}

interface MentionsItemProps {
  user: MentionOptionUser
  onSelect: (userId: string) => void
}

export function MentionsMenuItem(props: MentionsItemProps) {
  const {user, onSelect} = props
  const [loadedUser] = useUser(user.id)
  const {t} = useTranslation(commentsLocaleNamespace)

  const avatar = (
    <CommentsAvatar user={loadedUser} status={user.canBeMentioned ? undefined : 'inactive'} />
  )

  const text = loadedUser ? (
    <Text size={1} textOverflow="ellipsis" title={loadedUser.displayName}>
      {loadedUser.displayName}
    </Text>
  ) : (
    <TextSkeleton size={1} style={SKELETON_INLINE_STYLE} />
  )

  const handleSelect = useCallback(() => {
    onSelect(user.id)
  }, [onSelect, user.id])

  return (
    <Card as="button" disabled={!user.canBeMentioned} onClick={handleSelect} padding={2} radius={2}>
      <Flex align="center" gap={3}>
        <InnerFlex align="center" gap={2} flex={1}>
          {avatar}
          <Box>{text}</Box>
        </InnerFlex>

        {!user.canBeMentioned && (
          <Badge fontSize={1} mode="outline">
            {t('mentions.unauthorized-user')}
          </Badge>
        )}
      </Flex>
    </Card>
  )
}
