
"use client";

import { useEffect, useState, useMemo } from "react";
import { getSuppliers, Supplier, deleteSupplier } from "@/lib/api/suppliers";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Search, ChevronDown, ChevronUp, ArrowUpDown, Plus, Phone, Mail, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SupplierForm } from "./supplier-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SortKey = 'name' | 'contact_name' | 'email';
type SortDir = 'asc' | 'desc';

export function SuppliersList() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");

    // Sorting
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // State
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const data = await getSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du chargement des fournisseurs");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const toggleExpand = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            setIsCreating(false);
        }
    };

    const handleCreateStart = () => {
        setIsCreating(true);
        setExpandedId(null);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // prevent expanding row
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) return;
        try {
            await deleteSupplier(id);
            toast.success("Fournisseur supprimé");
            fetchSuppliers();
        } catch (e) {
            toast.error("Impossible de supprimer ce fournisseur (probablement lié à des ingrédients)");
        }
    };

    const filteredAndSortedSuppliers = useMemo(() => {
        let result = [...suppliers];

        // Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(lower) ||
                s.contact_name?.toLowerCase().includes(lower) ||
                s.email?.toLowerCase().includes(lower)
            );
        }

        // Sort
        result.sort((a, b) => {
            const valA = (a[sortKey] || "").toString().toLowerCase();
            const valB = (b[sortKey] || "").toString().toLowerCase(); // handle nulls
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [suppliers, searchTerm, sortKey, sortDir]);

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="space-y-4">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-lg border shadow-sm sticky top-20 z-10">
                <div className="flex flex-1 gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Rechercher un fournisseur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                <Button onClick={handleCreateStart} className="w-full md:w-auto gap-2">
                    <Plus className="h-4 w-4" /> Ajouter un fournisseur
                </Button>
            </div>

            {/* List Container */}
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                {/* Table Header (Desktop) */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b bg-slate-50 text-sm font-medium text-slate-500">
                    <div
                        className="col-span-4 flex items-center gap-2 cursor-pointer hover:text-slate-800"
                        onClick={() => handleSort('name')}
                    >
                        Nom {sortKey === 'name' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                    <div
                        className="col-span-3 flex items-center gap-2 cursor-pointer hover:text-slate-800"
                        onClick={() => handleSort('contact_name')}
                    >
                        Contact {sortKey === 'contact_name' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                    <div
                        className="col-span-3 flex items-center gap-2 cursor-pointer hover:text-slate-800"
                        onClick={() => handleSort('email')}
                    >
                        Email {sortKey === 'email' && <ArrowUpDown className="h-3 w-3" />}
                    </div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* New Item Form (Pinned Top) */}
                {isCreating && (
                    <div className="p-4 border-b bg-blue-50/30 animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-primary">Nouveau Fournisseur</h3>
                            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Fermer</Button>
                        </div>
                        <SupplierForm
                            onSuccess={() => {
                                setIsCreating(false);
                                fetchSuppliers();
                            }}
                            onCancel={() => setIsCreating(false)}
                        />
                    </div>
                )}

                {/* Rows */}
                <div className="divide-y">
                    {filteredAndSortedSuppliers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Aucun fournisseur trouvé
                        </div>
                    ) : (
                        filteredAndSortedSuppliers.map((supplier) => {
                            const isExpanded = expandedId === supplier.id;

                            return (
                                <div key={supplier.id} className={cn("group transition-colors", isExpanded ? "bg-slate-50" : "hover:bg-slate-50/50")}>
                                    {/* Collapsed Row Content */}
                                    <div
                                        className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer"
                                        onClick={() => toggleExpand(supplier.id)}
                                    >
                                        {/* Name & Mobile Primary Info */}
                                        <div className="col-span-12 md:col-span-4 font-medium flex items-center justify-between md:justify-start gap-3">
                                            <span className="text-base text-slate-900">{supplier.name}</span>
                                            <span className="md:hidden">
                                                {isExpanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                            </span>
                                        </div>

                                        {/* Contact Name */}
                                        <div className="col-span-12 md:col-span-3 text-sm text-slate-600 flex items-center gap-2">
                                            {supplier.contact_name ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                                        {supplier.contact_name.charAt(0)}
                                                    </span>
                                                    {supplier.contact_name}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">--</span>
                                            )}
                                        </div>

                                        {/* Email / Phone */}
                                        <div className="col-span-12 md:col-span-3 text-sm text-slate-600 flex flex-col md:block">
                                            {supplier.email && (
                                                <div className="flex items-center gap-2 truncate">
                                                    <Mail className="h-3 w-3 text-slate-400" />
                                                    {supplier.email}
                                                </div>
                                            )}
                                            {supplier.phone && (
                                                <div className="flex items-center gap-2 mt-1 md:mt-0 md:hidden">
                                                    <Phone className="h-3 w-3 text-slate-400" />
                                                    {supplier.phone}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions (Desktop) */}
                                        <div className="hidden md:flex col-span-2 justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={(e) => handleDelete(supplier.id, e)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon">
                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 md:px-6 md:pb-6 animate-in slide-in-from-top-1 border-t border-slate-100">
                                            <div className="pt-4">
                                                <SupplierForm
                                                    initialData={supplier}
                                                    onSuccess={() => {
                                                        fetchSuppliers();
                                                        setExpandedId(null);
                                                    }}
                                                    onCancel={() => setExpandedId(null)}
                                                />
                                                <div className="mt-4 flex justify-end md:hidden">
                                                    <Button variant="destructive" size="sm" onClick={(e) => handleDelete(supplier.id, e as any)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer ce fournisseur
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
