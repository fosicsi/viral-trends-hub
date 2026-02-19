import { Bell, Search, Menu, LogOut, User, Key, Sun, Moon, HelpCircle, Wifi, WifiOff, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
    DropdownMenuShortcut
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

interface DashboardHeaderProps {
    user: any;
    toggleTheme?: () => void;
    isDark?: boolean;
    customBackLink?: string;
    customBackLabel?: string;
    searchPlaceholder?: string;
}

export function DashboardHeader({
    user,
    toggleTheme,
    isDark,
    customBackLink,
    customBackLabel,
    searchPlaceholder = "Buscar..."
}: DashboardHeaderProps) {
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/auth');
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <div className="flex items-center gap-4">
                {customBackLink ? (
                    <Button
                        variant="ghost"
                        className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(customBackLink)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="font-semibold">{customBackLabel || "Volver"}</span>
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        {/* Mobile Menu Trigger could go here */}
                        <h1 className="font-bold text-lg tracking-tight">ViralTrends Hub</h1>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <form className="hidden md:block md:w-64 lg:w-80">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder={searchPlaceholder}
                            className="pl-8 w-full bg-muted/50 focus:bg-background transition-colors"
                        />
                    </div>
                </form>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                                        <Bell className="h-5 w-5" />
                                        {/* Status Indicator */}
                                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                            {isOnline ? (
                                                <>
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </>
                                            ) : (
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                            )}
                                        </span>
                                        <span className="sr-only">Estado del Sistema</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-80">
                                    <DropdownMenuLabel className="flex items-center justify-between">
                                        Estado del Sistema
                                        {isOnline ? (
                                            <span className="text-xs font-normal text-green-500 flex items-center gap-1">
                                                <Wifi className="h-3 w-3" /> Online
                                            </span>
                                        ) : (
                                            <span className="text-xs font-normal text-red-500 flex items-center gap-1">
                                                <WifiOff className="h-3 w-3" /> Offline
                                            </span>
                                        )}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                        <p>{isOnline ? "Todos los sistemas operativos." : "Comprueba tu conexión a internet."}</p>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isOnline ? "Sistema Online" : "Sin Conexión"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/10 hover:ring-primary/20 transition-all">
                            <Avatar className="h-9 w-9">
                                <AvatarImage
                                    src={user?.user_metadata?.avatar_url || "/placeholder-avatar.jpg"}
                                    alt={user?.email}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {user?.email?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none">{user?.user_metadata?.full_name || "Usuario"}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email || "usuario@ejemplo.com"}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Mi Perfil</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/integrations')}>
                                <Key className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>API Keys & Integraciones</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer" onClick={toggleTheme}>
                            {isDark ? <Sun className="mr-2 h-4 w-4 text-amber-500" /> : <Moon className="mr-2 h-4 w-4 text-indigo-500" />}
                            <span>{isDark ? "Modo Día" : "Modo Noche"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            <HelpCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Ayuda y Soporte</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="bg-red-50 text-red-600 focus:bg-red-100 focus:text-red-700 cursor-pointer dark:bg-red-950/30 dark:text-red-400 dark:focus:bg-red-950/50"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
