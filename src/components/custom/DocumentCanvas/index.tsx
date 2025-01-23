// import { useDocumentCanvas } from '@/hooks/useDocumentCanvas'
// import { Block } from '@/types/base/documents.types'
// import { useCallback } from 'react'

// export function DocumentCanvas({ documentId }: { documentId: string }) {
//   const { blocks, selectedBlockId, actions } = useDocumentCanvas(documentId)

//   const handleBlockUpdate = useCallback((blockId: string, content: Block['content']) => {
//     actions.updateBlock(blockId, content)
//   }, [actions])

//   const handleAddBlock = useCallback((position: number) => {
//     actions.addBlock({
//       document_id: documentId,
//       type: 'text',
//       position,
//       content: { text: '' }
//     })
//   }, [documentId, actions])

//   return (
//     <div className="min-h-screen p-4 max-w-4xl mx-auto">
//       {blocks.map((block, index) => (
//         <BlockComponent
//           key={block.id}
//           block={block}
//           isSelected={block.id === selectedBlockId}
//           onUpdate={handleBlockUpdate}
//           onAddBlock={() => handleAddBlock(index + 1)}
//           onDelete={() => actions.deleteBlock(block.id)}
//           onMove={(newPosition) => actions.moveBlock(block.id, newPosition)}
//           onSelect={() => actions.setSelectedBlock(block.id)}
//         />
//       ))}
//     </div>
//   )
// }
