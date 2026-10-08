import type { ReactNode } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '../../ui/table'
import type { ProseBlock } from './proseTypes'

/**
 * A fenced block: the language label on a raised header over mono code in an
 * inset well. The code scrolls sideways rather than wrapping.
 */
export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <View className="overflow-hidden rounded-md border border-border-subtle" testID="prose-code">
      {lang ? (
        <Surface
          raise={1}
          rounded={false}
          className="border-b border-border-subtle px-3 py-1"
          testID="prose-code-header"
        >
          <Typography variant="monoLabel" className="text-text-secondary" testID="prose-code-lang">
            {lang}
          </Typography>
        </Surface>
      ) : null}
      <Surface pressed rounded={false} testID="prose-code-body">
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <Text selectable className="px-3 py-2 font-mono text-xs leading-5 text-text-primary">
            {code}
          </Text>
        </ScrollView>
      </Surface>
    </View>
  )
}

interface ProseTableProps {
  block: ProseBlock
  inline: (text: string) => ReactNode[]
}

/** A pipe table as the shared Table: header row, body rows, per-column alignment. */
export function ProseTable({ block, inline }: ProseTableProps) {
  const header = block.header ?? []
  const align = block.align ?? []
  return (
    <Table density="dense" testID="prose-table">
      <TableHeader>
        <TableRow isHoverable={false}>
          {header.map((cell, c) => (
            <TableHeaderCell key={c} align={align[c]}>
              {cell}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {(block.rows ?? []).map((row, r) => (
          <TableRow key={r} isHoverable={false}>
            {row.map((cell, c) => (
              <TableCell key={c} align={align[c]}>
                <Text className="text-xs leading-5 text-text-primary">{inline(cell)}</Text>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
