import { MigrateUpArgs } from '@payloadcms/db-mongodb'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import {
  convertLexicalToMarkdown,
  convertMarkdownToLexical,
  editorConfigFactory,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const { docs } = await payload.find({
    collection: 'bookChapters',
    select: {
      content: true,
    },
    limit: 0,
    req,
  })

  for (const doc of docs) {
    const content = doc.content as SerializedEditorState
    const markdown = convertLexicalToMarkdown({
      data: content,
      editorConfig: await editorConfigFactory.default({
        config: payload.config,
      }),
    })
    //replace all 'ы' with 'и'
    const newMarkdown = markdown.replace(/ы/g, 'и')

    const lexicalJSON = convertMarkdownToLexical({
      editorConfig: await editorConfigFactory.default({
        config: payload.config,
      }),
      markdown: newMarkdown,
    })

    await payload.update({
      collection: 'bookChapters',
      data: {
        //@ts-expect-error : mismatched types between lexical and content field
        content: lexicalJSON,
      },
      id: doc.id,
      req,
    })
  }
}
