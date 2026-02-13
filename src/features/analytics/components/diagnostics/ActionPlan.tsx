
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wrench, Lightbulb, Copy, Check, ExternalLink, Bot, FileText, MessageSquare } from "lucide-react";
import { DiagnosticIssue, DiagnosticTool } from "@/features/analytics/utils/diagnosticEngine";
import { cn } from "@/lib/utils";

interface ActionToolProps {
    tool: DiagnosticTool;
}

function ActionTool({ tool }: ActionToolProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(tool.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (tool.type === 'ai_prompt') {
        return (
            <div className="mt-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-medium text-xs">
                        <Bot className="w-3.5 h-3.5" />
                        {tool.label}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded border border-border/50 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {tool.content}
                </div>
            </div>
        );
    }

    if (tool.type === 'script') {
        return (
            <div className="mt-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium text-xs">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {tool.label}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground italic bg-background/50 p-2 rounded border border-border/50">
                    "{tool.content}"
                </div>
            </div>
        );
    }

    if (tool.type === 'checklist') {
        return (
            <div className="mt-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-md p-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400 font-medium text-xs mb-2">
                    <FileText className="w-3.5 h-3.5" />
                    {tool.label}
                </div>
                <ul className="space-y-1.5">
                    {tool.content.split('\n').map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="mt-0.5 block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                            {item.replace(/^[✓\s-]+/, '')}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    if (tool.type === 'template' || tool.type === 'link') {
        return (
            <a
                href={tool.content}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-between gap-3 p-2.5 bg-background border border-border rounded-md hover:bg-accent/50 transition-colors group cursor-pointer no-underline"
            >
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <span className="text-lg">{tool.icon || (tool.type === 'template' ? '🎨' : '🔗')}</span>
                    {tool.label}
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
        );
    }

    return null;
}

interface ActionItemProps {
    priority: number;
    title: string;
    description: string;
    expertRef?: string;
    tools?: DiagnosticTool[];
}

function ActionItem({ priority, title, description, expertRef, tools }: ActionItemProps) {
    return (
        <div className="relative pl-6 pb-8 border-l-2 border-border last:pb-0 last:border-l-0">
            <div className={cn(
                "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-background",
                priority === 1 ? "border-red-500" : priority === 2 ? "border-amber-500" : "border-slate-300"
            )} />

            <div className="flex flex-col gap-1 -mt-1">
                <div className="flex items-center justify-between">
                    <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        priority === 1 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                            priority === 2 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                        Priority {priority}
                    </span>
                </div>

                <h4 className="font-semibold text-sm mt-1">{title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

                {expertRef && (
                    <div className="mt-2 text-xs bg-blue-50/80 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 p-2.5 rounded-md flex gap-2 items-start border border-blue-100 dark:border-blue-900/50">
                        <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
                        <span><span className="font-semibold">Expert Insight:</span> {expertRef}</span>
                    </div>
                )}

                {tools && tools.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {tools.map((tool, idx) => (
                            <ActionTool key={idx} tool={tool} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface ActionPlanProps {
    issues: DiagnosticIssue[];
}

export function ActionPlan({ issues }: ActionPlanProps) {
    // Show top 3 issues
    const topIssues = issues.slice(0, 3);

    return (
        <Card className="h-full border-l-4 border-l-primary shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">Plan de Acción (Toolkit)</CardTitle>
                        <p className="text-xs text-muted-foreground">Herramientas prácticas para optimizar ahora.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                {topIssues.length > 0 ? (
                    <>
                        <div className="space-y-1">
                            {topIssues.map((issue, idx) => (
                                <ActionItem
                                    key={idx}
                                    priority={issue.priority}
                                    title={issue.title}
                                    description={issue.actionable}
                                    expertRef={issue.expertTip}
                                    tools={issue.tools}
                                />
                            ))}
                        </div>
                        <Button className="w-full mt-6" variant="outline" size="sm">
                            Ver Informe Completo <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </>
                ) : (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-border/50 border-dashed">
                        <p className="text-sm font-medium">¡Sin problemas críticos!</p>
                        <p className="text-xs mt-1">Tus métricas están sólidas.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
