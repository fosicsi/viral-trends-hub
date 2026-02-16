import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, BookOpen, X } from "lucide-react";
import { glossaryTerms } from "@/data/glossaryData";
import { cn } from "@/lib/utils";

export function ViralGlossaryView() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

    // Get all unique starting letters
    const alphabet = useMemo(() => {
        const letters = new Set(glossaryTerms.map(term => term.term.charAt(0).toUpperCase()));
        return Array.from(letters).sort();
    }, []);

    // Filter terms
    const filteredTerms = useMemo(() => {
        return glossaryTerms.filter(term => {
            const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                term.definition.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesLetter = selectedLetter
                ? term.term.toUpperCase().startsWith(selectedLetter)
                : true;

            return matchesSearch && matchesLetter;
        }).sort((a, b) => a.term.localeCompare(b.term));
    }, [searchTerm, selectedLetter]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (e.target.value) setSelectedLetter(null); // Clear letter filter on search
    };

    const toggleLetter = (letter: string) => {
        if (selectedLetter === letter) {
            setSelectedLetter(null);
        } else {
            setSelectedLetter(letter);
            setSearchTerm(""); // Clear search on letter click
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Glosario de Términos</h1>
                        <p className="text-muted-foreground">
                            Diccionario esencial de marketing digital, IA y creación de contenido.
                        </p>
                    </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 mt-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar término o definición..."
                            className="pl-9 h-11 bg-surface border-border/50 rounded-xl"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Alphabet Filter */}
                <div className="flex flex-wrap gap-2 pt-2">
                    {alphabet.map(letter => (
                        <button
                            key={letter}
                            onClick={() => toggleLetter(letter)}
                            className={cn(
                                "w-10 h-10 rounded-xl text-sm font-bold transition-all duration-200 border",
                                selectedLetter === letter
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-110"
                                    : "bg-surface text-muted-foreground border-border/50 hover:border-primary/50 hover:text-foreground hover:bg-card"
                            )}
                        >
                            {letter}
                        </button>
                    ))}
                    {(selectedLetter || searchTerm) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSelectedLetter(null); setSearchTerm(""); }}
                            className="h-10 px-4 rounded-xl text-muted-foreground hover:text-foreground"
                        >
                            Limpiar Filtros
                        </Button>
                    )}
                </div>
            </div>

            {/* Terms Grid */}
            {filteredTerms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTerms.map((item, idx) => (
                        <Card key={idx} className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-bold text-primary group-hover:text-primary/80 transition-colors">
                                    {item.term}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {item.definition}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-4 opacity-50">
                    <Search className="w-12 h-12 text-muted-foreground" />
                    <p className="text-lg font-medium">No se encontraron resultados para "{searchTerm || selectedLetter}"</p>
                    <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedLetter(null); }}>
                        Ver todos los términos
                    </Button>
                </div>
            )}
        </div>
    );
}
