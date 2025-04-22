// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractTextFromNode = (node: any): string => {
  if (!node || typeof node !== 'object') {
    return ''
  }

  // Extract text from text nodes
  if (node.type === 'text' && node.text) {
    return node.text
  }

  // Recursively extract text from child nodes
  if (Array.isArray(node.children)) {
    return (
      node.children
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((child: any) => extractTextFromNode(child))
        .join(' ')
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim()
    )
  }

  // Fallback for other node types
  return ''
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const extractPlainText = (content: any): string => {
  if (!content || typeof content !== 'object') {
    // If the content is not an object, return an empty string
    return ''
  }

  // Check if the content is in Lexical's serialized editor state format
  if (content.root && Array.isArray(content.root.children)) {
    // Traverse the children of the root node
    return (
      content.root.children
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((child: any) => extractTextFromNode(child))
        .join(' ')
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim()
    )
  }

  // Fallback for other formats
  return ''
}
