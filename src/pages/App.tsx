 import { useAuth } from "@/hooks/useAuth";
 import { useNavigate } from "react-router-dom";
 import { useEffect } from "react";
 import ViralApp from "@/features/viral/ViralApp";
 import { Button } from "@/components/ui/button";
 import { LogOut } from "lucide-react";
 
 export default function AppPage() {
   const { user, loading, signOut } = useAuth();
   const navigate = useNavigate();
 
   useEffect(() => {
     if (!loading && !user) {
       navigate("/");
     }
   }, [user, loading, navigate]);
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="text-center">
           <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
           <p className="text-muted-foreground">Cargando...</p>
         </div>
       </div>
     );
   }
 
   if (!user) {
     return null;
   }
 
   return (
     <div className="relative">
       <div className="absolute top-4 right-4 z-50">
         <Button
           variant="outline"
           size="sm"
           onClick={signOut}
           className="gap-2"
         >
           <LogOut className="w-4 h-4" />
           Cerrar Sesión
         </Button>
       </div>
       <ViralApp />
     </div>
   );
 }