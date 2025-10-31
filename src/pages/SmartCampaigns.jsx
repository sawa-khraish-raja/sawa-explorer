import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles, Globe, Zap, Loader2, TrendingUp, Target,
  DollarSign, Users, Calendar, Eye, BarChart3, MapPin,
  Languages, RefreshCw, Plus, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { cn } from '@/lib/utils';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'dk', name: 'Dansk', flag: '🇩🇰' }
];

export default function SmartCampaigns() {
  const [generating, setGenerating] = useState(false);
  const [generatingMultilingual, setGeneratingMultilingual] = useState(false);
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['smartCampaigns'],
    queryFn: () => base44.entities.SmartCampaign.list('-created_date', 50)
  });

  // Fetch campaign content
  const { data: allContent = [] } = useQuery({
    queryKey: ['campaignContent'],
    queryFn: () => base44.entities.CampaignContent.list()
  });

  // Generate city campaigns
  const handleGenerateCityCampaigns = async () => {
    setGenerating(true);
    try {
      toast.info('🏙️ Generating city campaigns...');
      
      const response = await base44.functions.invoke('AI_City_Campaign_Generator', {
        cities: ['Damascus', 'Cairo'],
        countries: ['Germany', 'France'],
        personas: ['Cultural Explorers', 'Adventure Seekers'],
        generate_multilingual: true
      });
      
      if (response.data?.ok) {
        toast.success(`✅ ${response.data.campaigns_generated} campaigns created!`);
        queryClient.invalidateQueries({ queryKey: ['smartCampaigns'] });
        queryClient.invalidateQueries({ queryKey: ['campaignContent'] });
      } else {
        toast.error(response.data?.error || 'Generation failed');
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Generate multilingual content for existing campaign
  const handleGenerateMultilingual = async (campaignId, city) => {
    setGeneratingMultilingual(true);
    try {
      toast.info(`🌐 Generating content in ${SUPPORTED_LANGUAGES.length} languages...`);
      
      const response = await base44.functions.invoke('AI_Multilingual_Generator', {
        campaign_id: campaignId,
        target_city: city
      });
      
      if (response.data?.ok) {
        toast.success(`✅ Content generated in ${response.data.languages_generated} languages!`);
        queryClient.invalidateQueries({ queryKey: ['campaignContent'] });
      } else {
        toast.error(response.data?.error || 'Generation failed');
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setGeneratingMultilingual(false);
    }
  };

  if (isLoading) {
    return (
      <MarketingLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </MarketingLayout>
    );
  }

  return (
    <MarketingLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-purple-600" />
              Smart Campaigns
            </h1>
            <p className="text-sm text-gray-600">
              AI-powered campaigns for SAWA cities targeting Europe
            </p>
          </div>
          
          <Button
            onClick={handleGenerateCityCampaigns}
            disabled={generating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate City Campaigns
              </>
            )}
          </Button>
        </div>

        {/* Languages Info */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Supported Languages</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map(lang => (
                <Badge key={lang.code} variant="outline" className="gap-1">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Campaigns Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Generate AI-powered campaigns for SAWA cities
              </p>
              <Button
                onClick={handleGenerateCityCampaigns}
                disabled={generating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                Create First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {campaigns.map((campaign) => {
              const content = allContent.filter(c => c.campaign_id === campaign.id);
              const hasMultilingual = content.length > 1;
              const city = campaign.target_cities?.[0] || 'Unknown';
              
              return (
                <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {campaign.campaign_name}
                        </CardTitle>
                        <CardDescription>{campaign.message_theme}</CardDescription>
                      </div>
                      <Badge className={cn(
                        campaign.status === 'active' && 'bg-green-100 text-green-800',
                        campaign.status === 'draft' && 'bg-yellow-100 text-yellow-800',
                        campaign.status === 'paused' && 'bg-gray-100 text-gray-800'
                      )}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* City & Country */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold">{city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{campaign.target_country}</span>
                      </div>
                    </div>

                    {/* Persona & Budget */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm">{campaign.target_persona}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold">
                          ${campaign.budget_suggestion}/{campaign.budget_currency}
                        </span>
                      </div>
                    </div>

                    {/* Platforms */}
                    <div className="flex flex-wrap gap-2">
                      {campaign.platforms?.map(platform => (
                        <Badge key={platform} variant="outline" className="text-xs">
                          {platform}
                        </Badge>
                      ))}
                    </div>

                    {/* Languages */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Languages className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">
                          Languages ({content.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {content.map(c => {
                          const lang = SUPPORTED_LANGUAGES.find(l => l.code === c.language);
                          return lang ? (
                            <span key={c.language} className="text-xl" title={lang.name}>
                              {lang.flag}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      {!hasMultilingual && (
                        <Button
                          onClick={() => handleGenerateMultilingual(campaign.id, city)}
                          disabled={generatingMultilingual}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Languages className="w-4 h-4 mr-2" />
                          Generate All Languages
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>

                    {/* Performance Score */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <span className="text-sm font-medium">Performance Score</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-purple-600">
                          {campaign.performance_score}/100
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MarketingLayout>
  );
}