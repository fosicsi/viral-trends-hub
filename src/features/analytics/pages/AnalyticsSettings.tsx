
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function AnalyticsSettings() {
    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Configuración de Analíticas</h2>
                <p className="text-muted-foreground">
                    Personaliza tu dashboard, alertas y conexiones.
                </p>
            </div>

            <Tabs defaultValue="account" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="account">Cuenta y Conexión</TabsTrigger>
                    <TabsTrigger value="alerts">Alertas y Notificaciones</TabsTrigger>
                    <TabsTrigger value="display">Visualización</TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conexión con YouTube</CardTitle>
                            <CardDescription>
                                Gestiona la conexión con tu canal para obtener datos reales.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/20">
                                <div className="space-y-1">
                                    <p className="font-medium">Estado de Conexión</p>
                                    <p className="text-sm text-muted-foreground">Conectado como <strong>Adrian Marin</strong></p>
                                </div>
                                <Button variant="destructive" size="sm">Desconectar</Button>
                            </div>
                            <div className="space-y-2">
                                <Label>Frecuencia de Actualización</Label>
                                <div className="flex items-center space-x-2">
                                    <Switch id="auto-update" defaultChecked />
                                    <Label htmlFor="auto-update">Actualizar datos automáticamente cada 24h</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="alerts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de Alertas F1</CardTitle>
                            <CardDescription>
                                Define qué métricas son críticas para ti.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Alertas de Retención</Label>
                                    <p className="text-sm text-muted-foreground">Notificar si la retención cae por debajo del 40%.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Oportunidades Virales</Label>
                                    <p className="text-sm text-muted-foreground">Avisar cuando un tema esté en tendencia.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Resumen Semanal</Label>
                                    <p className="text-sm text-muted-foreground">Enviar reporte PDF al correo cada lunes.</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="display">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personalización del Dashboard</CardTitle>
                            <CardDescription>
                                Elige qué métricas ver primero.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Métrica Principal</Label>
                                    <select className="w-full p-2 border rounded-md bg-background">
                                        <option>Vistas Totales</option>
                                        <option>CTR</option>
                                        <option>Ingresos Estimados</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Vista Predeterminada</Label>
                                    <select className="w-full p-2 border rounded-md bg-background">
                                        <option>Resumen</option>
                                        <option>Estrategia (CCN)</option>
                                        <option>Diagnóstico</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Guardar Preferencias</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
