import { Canvas } from '@/components/Canvas/Canvas';
import { CanvasNavigation } from '@/components/Canvas/components/misc/CanvasNavigation';

export default async function DocumentPage({ 
    params 
}: { 
    params: Promise<{ documentId: string; orgId: string; projectId: string }>
}) {
    const { documentId, orgId, projectId } = await params;
    
    return (
        <div className="p-4">
            <Canvas />
        </div>
    );
}
