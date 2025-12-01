'use client';

import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface UnsavedChangesDialogProps {
    open: boolean;
    onSaveAndExit: () => void;
    onDiscard: () => void;
    onCancel: () => void;
    isSaving?: boolean;
}

export function UnsavedChangesDialog({
    open,
    onSaveAndExit,
    onDiscard,
    onCancel,
    isSaving = false,
}: UnsavedChangesDialogProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                    <AlertDialogDescription>
                        You have unsaved changes to this diagram. Would you like to save
                        before leaving?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onDiscard} disabled={isSaving}>
                        Discard
                    </Button>
                    <Button onClick={onSaveAndExit} disabled={isSaving}>
                        {isSaving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </div>
                        ) : (
                            'Save & Exit'
                        )}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
