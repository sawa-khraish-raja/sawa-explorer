/**
 * Admin: AI Auto-Healing Dashboard
 * Real-time monitoring of AI predictions and healing actions
 */

import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, Activity, AlertTriangle, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { metricsCollector } from "../components/monitoring/metrics";
import AdminLayout from "../components/admin/AdminLayout";

export default function AdminAIMonitoring() {
  const [aiStatus, setAiStatus] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch current metrics snapshot
  const metrics = metricsCollector.snapshot();

  // Auto-refresh AI status
  useEffect(() => {
    refreshAIStatus();
    const interval = setInterval(refreshAIStatus, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  const refreshAIStatus = async () => {
    try {
      const currentMetrics = metricsCollector.snapshot();
      
      const { data } = await base44.functions.invoke('ai/autoheal', {
        metrics: currentMetrics
      });
      
      setAiStatus(data);
    } catch (error) {
      console.error('[AI_MONITORING] Error:', error);
    }
  };

  const handleManualAnalysis = async () => {
    setIsAnalyzing(true);
    await refreshAIStatus();
    setIsAnalyzing(false);
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity) => {
    if (severity >= 8) return 'text-red-600';
    if (severity >= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Auto-Healing System</h1>
                <p className="text-gray-600 mt-1">Predictive monitoring and automatic healing</p>
              </div>
            </div>
            <Button
              onClick={handleManualAnalysis}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Configuration Status */}
        {aiStatus?.config && (
          <Card className="mb-6 border-2 border-purple-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">AI Mode</p>
                  <Badge variant="outline" className="font-mono">
                    {aiStatus.config.ai_mode}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Auto-Heal</p>
                  <Badge className={aiStatus.config.autoheal_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {aiStatus.config.autoheal_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Threshold</p>
                  <span className="font-bold text-gray-900">{aiStatus.config.threshold} errors</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">HTTP Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{metrics.http_errors}</div>
              <p className="text-xs text-gray-500 mt-1">Last hour</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Translation Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{metrics.translate_429}</div>
              <p className="text-xs text-gray-500 mt-1">429 responses</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Voice Failures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{metrics.voice_failures}</div>
              <p className="text-xs text-gray-500 mt-1">Failed requests</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">P95 Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{metrics.latency_p95}ms</div>
              <p className="text-xs text-gray-500 mt-1">95th percentile</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Results */}
        {aiStatus?.analysis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Risk Level</p>
                    <Badge className={`${getRiskColor(aiStatus.analysis.risk)} text-lg px-4 py-2 border-2`}>
                      {aiStatus.analysis.risk.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Severity Score</p>
                    <div className={`text-4xl font-bold ${getSeverityColor(aiStatus.analysis.severity)}`}>
                      {aiStatus.analysis.severity}/10
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Analysis Mode</p>
                    <Badge variant="outline" className="font-mono">
                      {aiStatus.analysis.mode}
                    </Badge>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Reason:</p>
                  <p className="text-gray-900">{aiStatus.analysis.reason}</p>
                </div>

                {aiStatus.analysis.recommended_actions && aiStatus.analysis.recommended_actions.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Recommended Actions:</p>
                    <div className="space-y-2">
                      {aiStatus.analysis.recommended_actions.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-900">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Healing Actions */}
        {aiStatus?.healing && (
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                Healing Actions Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                    {aiStatus.healing.action}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {new Date(aiStatus.healing.timestamp).toLocaleString()}
                  </span>
                </div>
                
                {aiStatus.healing.actions_taken && aiStatus.healing.actions_taken.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {aiStatus.healing.actions_taken.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-green-50 rounded-lg p-3 border border-green-200">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {action.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Logs */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent System Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <SystemLogsTable />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function SystemLogsTable() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: () => base44.entities.SystemLog.list('-fixedAt', 20),
    refetchInterval: 30000
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Timestamp</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Issue</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Method</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 text-sm text-gray-600">
                {new Date(log.fixedAt).toLocaleString()}
              </td>
              <td className="py-3 px-4 text-sm text-gray-900">{log.issue}</td>
              <td className="py-3 px-4">
                <Badge variant="outline" className="text-xs">{log.method}</Badge>
              </td>
              <td className="py-3 px-4">
                <Badge className={log.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {log.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}