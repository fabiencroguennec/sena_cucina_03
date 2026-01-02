import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookUser } from "lucide-react";
import { SuppliersList } from "./suppliers-list";

export function DirectoryDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Répertoire Fournisseurs">
                    <BookUser className="h-5 w-5 text-slate-500" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="text-xl font-serif">Répertoire Fournisseurs</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    <SuppliersList />
                </div>
            </DialogContent>
        </Dialog>
    );
}
