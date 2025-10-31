import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MarketingLayout from '../components/marketing/MarketingLayout';
import MarketingGuard from '../components/marketing/MarketingGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MapPin,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw,
  Download,
  Brain,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

export default function SmartGrowthPlan() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  // ✅ Fetch active growth plan
  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['active_growth_plan'],
    queryFn: async () => {
      const plans = await base44.entities.GrowthPlan.filter({ status: 'active' });
      return plans.length > 0 ? plans[0] : null;
    },
    refetchInterval: 60000,
  });

  // ✅ Generate new plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      setGenerating(true);
      const response = await base44.functions.invoke('AI_Smart_Growth_Planner', {});
      
      if (!response?.data?.ok) {
        throw new Error(response?.data?.error || 'Generation failed');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['active_growth_plan'] });
      toast.success('Growth Plan Generated!', {
        description: `${data.month_year} plan with Growth Index: ${data.growth_index}`,
        duration: 4000
      });
    },
    onError: (error) => {
      toast.error('Generation Failed', {
        description: error.message
      });
    },
    onSettled: () => {
      setGenerating(false);
    }
  });

  const getImpactColor = (impact) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return colors[impact] || colors.medium;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    return colors[priority] || colors.medium;
  };

  if (planLoading) {
    return (
      <MarketingGuard>
        <MarketingLayout>
          <div className="flex flex-col justify-center items-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Loading growth plan...</p>
          </div>
        </MarketingLayout>
      </MarketingGuard>
    );
  }

  return (
    <MarketingGuard>
      <MarketingLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 md:w-10 md:h-10" />
                  Smart Growth Plan
                </h1>
                <p className="text-purple-100 text-base md:text-lg">
                  AI-powered strategic growth planning for SAWA
                </p>
                {plan && (
                  <p className="text-sm text-purple-200 mt-2">
                    Current Plan: {plan.month_year} • Growth Index: {plan.growth_index}/100
                  </p>
                )}
              </div>
              <Button
                onClick={() => generatePlanMutation.mutate()}
                disabled={generating}
                className="bg-white text-purple-600 hover:bg-purple-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate New Plan
                  </>
                )}
              </Button>
            </div>

            {plan && (
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/80 text-xs mb-1">Growth Index</p>
                  <p className="text-2xl font-bold">{plan.growth_index}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/80 text-xs mb-1">Opportunities</p>
                  <p className="text-2xl font-bold">{plan.key_opportunities?.length || 0}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/80 text-xs mb-1">Actions</p>
                  <p className="text-2xl font-bold">{plan.recommended_actions?.length || 0}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white/80 text-xs mb-1">Target Cities</p>
                  <p className="text-2xl font-bold">{plan.target_cities?.length || 0}</p>
                </div>
              </div>
            )}
          </div>

          {plan ? (
            <>
              {/* Executive Summary */}
              {plan.ai_summary && (
                <Card className="border-2 border-purple-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed">
                      {plan.ai_summary.en || plan.ai_summary}
                    </p>
                    {plan.ai_summary.ar && (
                      <p className="text-gray-700 leading-relaxed mt-4 text-right" dir="rtl">
                        {plan.ai_summary.ar}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Strategic Insights */}
              {plan.strategic_insights && plan.strategic_insights.length > 0 && (
                <Card className="border-2 border-blue-200">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      AI Strategic Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {plan.strategic_insights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                          <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-gray-900">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Opportunities */}
              {plan.key_opportunities && plan.key_opportunities.length > 0 && (
                <Card className="border-2 border-green-200">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      Key Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {plan.key_opportunities.map((opp, idx) => (
                        <div key={idx} className="p-5 bg-green-50 rounded-lg border-l-4 border-green-600">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-gray-900 text-lg">{opp.title}</h4>
                            <Badge className={getImpactColor(opp.impact)}>
                              {opp.impact} impact
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{opp.description}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>Market: {opp.market}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Actions */}
              {plan.recommended_actions && plan.recommended_actions.length > 0 && (
                <Card className="border-2 border-orange-200">
                  <CardHeader className="bg-gradient-to-r from-orange-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-orange-600" />
                      Recommended Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {plan.recommended_actions.map((action, idx) => (
                        <div key={idx} className="p-5 bg-orange-50 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 flex-1">{action.action}</h4>
                            <Badge className={getPriorityColor(action.priority)}>
                              {action.priority}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Timeline:</span>
                              <span className="ml-2 font-semibold text-gray-900">{action.timeline}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Expected Impact:</span>
                              <span className="ml-2 font-semibold text-gray-900">{action.expected_impact}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Target Cities */}
              {plan.target_cities && plan.target_cities.length > 0 && (
                <Card className="border-2 border-purple-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      Target Cities for Expansion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.target_cities.map((city, idx) => (
                        <div key={idx} className="p-5 bg-purple-50 rounded-lg border-2 border-purple-200">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-gray-900 text-lg">{city.city}</h4>
                            <Badge className="bg-purple-600 text-white">
                              Score: {city.opportunity_score?.toFixed(0)}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Performance:</span>
                              <span className="font-semibold capitalize">{city.current_performance}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Growth Potential:</span>
                              <span className="font-semibold capitalize">{city.growth_potential}</span>
                            </div>
                            <div className="pt-2 border-t border-purple-200">
                              <p className="text-gray-700">{city.recommended_focus}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Revenue Forecast */}
              {plan.predicted_revenue && (
                <Card className="border-2 border-green-200">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Revenue Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-white rounded-xl border-2 border-green-200 mb-6">
                      <p className="text-sm text-gray-600 mb-2">Predicted Monthly Revenue</p>
                      <p className="text-5xl font-bold text-green-600 mb-2">
                        ${plan.predicted_revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {((plan.predicted_revenue / (plan.predicted_revenue / 1.15 || 1) - 1) * 100).toFixed(1)}% growth projected
                      </p>
                    </div>
                    
                    {plan.revenue_breakdown && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {plan.revenue_breakdown.by_city && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">By City</h4>
                            <div className="space-y-2">
                              {Object.entries(plan.revenue_breakdown.by_city).map(([city, revenue]) => (
                                <div key={city} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                  <span className="text-gray-700">{city}</span>
                                  <span className="font-bold text-green-600">${revenue.toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {plan.revenue_breakdown.by_persona && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">By Persona</h4>
                            <div className="space-y-2">
                              {Object.entries(plan.revenue_breakdown.by_persona).map(([persona, revenue]) => (
                                <div key={persona} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                  <span className="text-gray-700">{persona}</span>
                                  <span className="font-bold text-green-600">${revenue.toFixed(0)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Risk Assessment */}
              {plan.ai_risk_assessment && plan.ai_risk_assessment.length > 0 && (
                <Card className="border-2 border-red-200">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-white border-b">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Risk Assessment & Mitigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {plan.ai_risk_assessment.map((risk, idx) => (
                        <div key={idx} className="p-5 bg-red-50 rounded-lg border-l-4 border-red-600">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-gray-900">{risk.risk_type}</h4>
                            <div className="flex gap-2">
                              <Badge className={getImpactColor(risk.severity)}>
                                {risk.severity}
                              </Badge>
                              <Badge className={getImpactColor(risk.probability)}>
                                {risk.probability} probability
                              </Badge>
                            </div>
                          </div>
                          <div className="pt-3 border-t border-red-200">
                            <p className="text-sm text-gray-600 mb-1">Mitigation Strategy:</p>
                            <p className="text-gray-900">{risk.mitigation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-2 border-purple-200">
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-20 h-20 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Growth Plan Yet</h3>
                <p className="text-gray-700 mb-6">
                  Generate your first AI-powered strategic growth plan
                </p>
                <Button
                  onClick={() => generatePlanMutation.mutate()}
                  disabled={generating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Growth Plan
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </MarketingLayout>
    </MarketingGuard>
  );
}