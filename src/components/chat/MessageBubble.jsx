import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Clock,
  X,
  XCircle,
  Check,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Function';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;

  const parsedResults = (() => {
    if (!results) return null;
    try {
      return typeof results === 'string' ? JSON.parse(results) : results;
    } catch {
      return results;
    }
  })();

  const isError =
    results &&
    ((typeof results === 'string' && /error|failed/i.test(results)) ||
      parsedResults?.success === false);

  const statusConfig = {
    pending: { icon: Clock, color: 'text-slate-400', text: 'Pending' },
    running: {
      icon: Loader2,
      color: 'text-slate-500',
      text: 'Running...',
      spin: true,
    },
    in_progress: {
      icon: Loader2,
      color: 'text-slate-500',
      text: 'Running...',
      spin: true,
    },
    completed: isError
      ? { icon: AlertCircle, color: 'text-red-500', text: 'Failed' }
      : { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
    success: { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
    failed: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' },
    error: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' },
  }[status] || { icon: Zap, color: 'text-slate-500', text: '' };

  const Icon = statusConfig.icon;
  const formattedName = name.split('.').reverse().join(' ').toLowerCase();

  return (
    <div className='mt-2 text-xs'>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all',
          'hover:bg-slate-50',
          expanded ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200'
        )}
      >
        <Icon className={cn('h-3 w-3', statusConfig.color, statusConfig.spin && 'animate-spin')} />
        <span className='text-slate-700'>{formattedName}</span>
        {statusConfig.text && (
          <span className={cn('text-slate-500', isError && 'text-red-600')}>
            • {statusConfig.text}
          </span>
        )}
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight
            className={cn(
              'h-3 w-3 text-slate-400 transition-transform ml-auto',
              expanded && 'rotate-90'
            )}
          />
        )}
      </button>

      {expanded && !statusConfig.spin && (
        <div className='mt-1.5 ml-3 pl-3 border-l-2 border-slate-200 space-y-2'>
          {toolCall.arguments_string && (
            <div>
              <div className='text-xs text-slate-500 mb-1'>Parameters:</div>
              <pre className='bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap'>
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2);
                  } catch {
                    return toolCall.arguments_string;
                  }
                })()}
              </pre>
            </div>
          )}
          {parsedResults && (
            <div>
              <div className='text-xs text-slate-500 mb-1'>Result:</div>
              <pre className='bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-auto'>
                {typeof parsedResults === 'object'
                  ? JSON.stringify(parsedResults, null, 2)
                  : String(parsedResults)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LANGUAGE_NAMES = {
  en: 'English',
  ar: 'العربية',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  nl: 'Nederlands',
  sv: 'Svenska',
  da: 'Dansk',
};

const normalizeLangCode = (lang) => {
  if (!lang) return null;
  return lang.toLowerCase().split('-')[0].split('_')[0];
};

export default function MessageBubble({
  message,
  currentUserEmail,
  displayLanguage = 'en',
  isHostInConversation = false,
  offers = [],
  onAcceptOffer,
  onDeclineOffer,
  hasAcceptedOffer = false, // Keep for potential external usage, not used internally for offer logic anymore
  isAcceptingOffer = false,
  isDecliningOffer = false,
  isBookingCancelled = false,
}) {
  const isUser = message.role === 'user' || message.sender_email === currentUserEmail;
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [translatedTextState, setTranslatedTextState] = useState(null);
  const [translationError, setTranslationError] = useState(false);

  const normalizedSourceLang = normalizeLangCode(message.source_lang);
  const normalizedDisplayLang = normalizeLangCode(displayLanguage);

  const navigate = useNavigate();

  const needsTranslation =
    !isUser && normalizedSourceLang && normalizedSourceLang !== normalizedDisplayLang;

  const cachedTranslation = message.translations?.[normalizedDisplayLang];

  const displayText = useMemo(() => {
    if (!message.original_text) return '';

    if (isUser) {
      return message.original_text;
    }

    if (showOriginal) {
      return message.original_text;
    }

    if (!needsTranslation) {
      return message.original_text;
    }

    if (cachedTranslation) {
      return cachedTranslation;
    }

    if (translatedTextState) {
      return translatedTextState;
    }

    return message.original_text;
  }, [
    message,
    normalizedDisplayLang,
    needsTranslation,
    showOriginal,
    translatedTextState,
    cachedTranslation,
    isUser,
  ]);

  useEffect(() => {
    const shouldTranslate =
      needsTranslation && !cachedTranslation && !translatedTextState && !showOriginal && !isUser;

    if (shouldTranslate) {
      translateMessage();
    }
  }, [
    message.id,
    normalizedDisplayLang,
    needsTranslation,
    isUser,
    cachedTranslation,
    translatedTextState,
    showOriginal,
    message.original_text,
  ]);

  const translateMessage = async () => {
    if (isTranslating || !message.original_text || isUser) return;

    setIsTranslating(true);
    setTranslationError(false);

    try {
      const response = await base44.functions.invoke('messageTranslator', {
        text: message.original_text,
        toLang: normalizedDisplayLang,
        context: 'chat',
      });

      if (response.data?.ok && response.data?.translated) {
        setTranslatedTextState(response.data.translated);

        try {
          const currentTranslations = message.translations || {};
          const updatedTranslations = {
            ...currentTranslations,
            [normalizedDisplayLang]: response.data.translated,
          };

          await base44.entities.Message.update(message.id, {
            translations: updatedTranslations,
          });
        } catch (e) {
          console.warn('⚠️ Failed to cache translation for message ID:', message.id, e);
        }
      } else {
        setTranslationError(true);
      }
    } catch (error) {
      console.error(' [MessageBubble] Translation error:', error);
      setTranslationError(true);
    } finally {
      setIsTranslating(false);
    }
  };

  const translatedText = (english, arabic) => {
    if (normalizedDisplayLang === 'ar') {
      return arabic;
    }
    return english;
  };

  const offerData = message.offer_data;
  const hasOffer = offerData && offerData.id;

  //  FIXED: Check accepted offers by type
  const acceptedServiceOffer = useMemo(
    () => offers.find((o) => o.status === 'accepted' && o.offer_type === 'service'),
    [offers]
  );

  const acceptedRentalOffer = useMemo(
    () => offers.find((o) => o.status === 'accepted' && o.offer_type === 'rental'),
    [offers]
  );

  const renderOfferCard = (offerData) => {
    if (!offerData) return null;

    console.log('🔍 [MessageBubble] Rendering offer card:', {
      offerId: offerData.id,
      isBookingCancelled,
      offerType: offerData.offer_type,
      status: offerData.status,
      acceptedServiceOffer: acceptedServiceOffer?.id,
      acceptedRentalOffer: acceptedRentalOffer?.id,
    });

    const isServiceOffer = offerData.offer_type === 'service';
    const isRentalOffer = offerData.offer_type === 'rental';

    const isAccepted = offerData.status === 'accepted';
    const isDeclined = offerData.status === 'declined';
    const isExpired = offerData.status === 'expired';
    const isPending = offerData.status === 'pending';

    //  FIXED: Can accept based on offer type
    const canAcceptThisOffer = (() => {
      if (isBookingCancelled) return false;
      if (offerData.status !== 'pending') return false;

      // For service offers: can accept if no service offer is accepted
      if (isServiceOffer) {
        return !acceptedServiceOffer;
      }

      // For rental offers: can accept if no rental offer is accepted
      if (isRentalOffer) {
        return !acceptedRentalOffer;
      }

      return false;
    })();

    const canDecline = offerData.status === 'pending' && !isBookingCancelled;

    //  Show appropriate blocking message
    const getBlockingMessage = () => {
      if (isBookingCancelled) {
        return translatedText('Booking is cancelled', 'الحجز ملغي');
      }

      if (isServiceOffer && acceptedServiceOffer && acceptedServiceOffer.id !== offerData.id) {
        return translatedText(
          'Another service offer was already accepted',
          'تم قبول عرض خدمات آخر'
        );
      }

      if (isRentalOffer && acceptedRentalOffer && acceptedRentalOffer.id !== offerData.id) {
        return translatedText('Another rental offer was already accepted', 'تم قبول عرض إيجار آخر');
      }

      return null;
    };

    const blockingMessage = getBlockingMessage();

    const handleCheckoutClick = () => {
      navigate(createPageUrl('MyOffers'));
    };

    const statusBadge = () => {
      if (isAccepted) {
        return (
          <Badge className='bg-green-100 text-green-800 border-green-200'>
            <CheckCircle2 className='w-3 h-3 mr-1' />
            {translatedText('Accepted', 'تم القبول')}
          </Badge>
        );
      }
      if (isDeclined) {
        return (
          <Badge className='bg-red-100 text-red-800 border-red-200'>
            <X className='w-3 h-3 mr-1' />
            {translatedText('Declined', 'مرفوض')}
          </Badge>
        );
      }
      if (isExpired) {
        return (
          <Badge className='bg-orange-100 text-orange-800 border-orange-200'>
            <AlertCircle className='w-3 h-3 mr-1' />
            {translatedText('Expired', 'منتهي')}
          </Badge>
        );
      }
      return (
        <Badge className='bg-blue-100 text-blue-800 border-blue-200'>
          ⏳ {translatedText('Pending', 'قيد الانتظار')}
        </Badge>
      );
    };

    // CRITICAL: Check if should show checkout
    const shouldShowCheckout =
      isAccepted && isServiceOffer && !isHostInConversation && !isBookingCancelled;

    console.log('🔍 [MessageBubble] Checkout visibility:', {
      shouldShowCheckout,
      isAccepted,
      isServiceOffer,
      isHostInConversation,
      isBookingCancelled,
    });

    return (
      <Card
        className={cn(
          'p-4 my-2 border-2',
          isAccepted && 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300',
          isDeclined && 'bg-gray-100 border-gray-300 opacity-60',
          isPending &&
            !blockingMessage &&
            'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300',
          isPending && blockingMessage && 'bg-yellow-50 border-yellow-300'
        )}
      >
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-base font-bold text-gray-900 flex items-center gap-2'>
              {isRentalOffer ? '🏠' : '📦'}
              {translatedText(
                isRentalOffer ? 'Rental Offer' : 'Service Offer',
                isRentalOffer ? 'عرض إيجار' : 'عرض خدمة'
              )}
            </CardTitle>
            {statusBadge()}
          </div>
        </CardHeader>

        <CardContent className='space-y-3'>
          {/* CRITICAL: Only show checkout if booking is NOT cancelled */}
          {shouldShowCheckout && (
            <Button
              onClick={handleCheckoutClick}
              className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2'
            >
              <DollarSign className='w-5 h-5' />
              {translatedText('Proceed to Checkout', 'المتابعة للدفع')}
            </Button>
          )}

          {/* Price */}
          <div className='flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-full bg-green-100 flex items-center justify-center'>
                <DollarSign className='w-4 h-4 text-green-600' />
              </div>
              <span className='text-sm text-gray-600'>
                {translatedText('Total Price', 'السعر الإجمالي')}
              </span>
            </div>
            <span className='text-2xl font-bold text-gray-900'>
              ${offerData.price_total || offerData.price_base}
            </span>
          </div>

          {/* Price Breakdown */}
          {offerData.price_breakdown && isServiceOffer && (
            <div className='p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1'>
              <div className='flex justify-between text-gray-600'>
                <span>{translatedText('Base Price', 'السعر الأساسي')}</span>
                <span className='font-semibold'>${offerData.price_breakdown.base_price}</span>
              </div>
              {offerData.price_breakdown.sawa_fee > 0 && (
                <div className='flex justify-between text-gray-600'>
                  <span>
                    {translatedText('SAWA Fee', 'رسوم SAWA')} (
                    {offerData.price_breakdown.sawa_percent}%)
                  </span>
                  <span className='font-semibold'>${offerData.price_breakdown.sawa_fee}</span>
                </div>
              )}
              {offerData.price_breakdown.office_fee > 0 && (
                <div className='flex justify-between text-gray-600'>
                  <span>
                    {translatedText('Office Fee', 'رسوم المكتب')} (
                    {offerData.price_breakdown.office_percent}%)
                  </span>
                  <span className='font-semibold'>${offerData.price_breakdown.office_fee}</span>
                </div>
              )}
              <div className='flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-300'>
                <span>{translatedText('Total', 'المجموع')}</span>
                <span>${offerData.price_breakdown.total}</span>
              </div>
            </div>
          )}

          {/* Inclusions */}
          {offerData.inclusions && (
            <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
              <p className='text-xs font-semibold text-gray-900 mb-1'>
                {translatedText("What's Included:", 'ما يشمله:')}
              </p>
              <p className='text-xs text-gray-700 whitespace-pre-wrap'>{offerData.inclusions}</p>
            </div>
          )}

          {/* Rental Details */}
          {offerData.rental_details && (
            <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
              <p className='text-xs font-semibold text-gray-900 mb-1'>
                {translatedText('Rental Details:', 'تفاصيل الإيجار:')}
              </p>
              <p className='text-xs text-gray-700 whitespace-pre-wrap'>
                {offerData.rental_details}
              </p>
            </div>
          )}

          {/*  Action Buttons */}
          {!isHostInConversation && isPending && !isBookingCancelled && (
            <div className='mt-4 space-y-2'>
              {canAcceptThisOffer ? (
                <div className='flex gap-2'>
                  <Button
                    onClick={async () => {
                      console.log(
                        ' [MessageBubble] Accept button clicked for offer:',
                        offerData.id
                      );

                      if (onAcceptOffer && typeof onAcceptOffer === 'function') {
                        console.log(' [MessageBubble] Calling onAcceptOffer...');
                        await onAcceptOffer(offerData.id);
                      } else {
                        console.error(' [MessageBubble] onAcceptOffer is not a function!');
                      }
                    }}
                    disabled={isAcceptingOffer}
                    className='flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md'
                  >
                    {isAcceptingOffer ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />{' '}
                        {translatedText('Accepting...', 'جاري القبول...')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className='w-4 h-4 mr-2' />{' '}
                        {translatedText('Accept Offer', 'قبول العرض')}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => onDeclineOffer && onDeclineOffer(offerData.id)}
                    disabled={isDecliningOffer || !canDecline}
                    variant='outline'
                    className='border-2 border-gray-300 hover:border-red-400 hover:bg-red-50'
                  >
                    {isDecliningOffer ? (
                      <Loader2 className='w-4 h-4 animate-spin text-gray-600' />
                    ) : (
                      <X className='w-4 h-4 text-gray-600' />
                    )}
                  </Button>
                </div>
              ) : (
                blockingMessage && (
                  <div className='bg-yellow-100 border border-yellow-400 rounded-lg p-3 flex items-start gap-2'>
                    <AlertTriangle className='w-4 h-4 text-yellow-700 mt-0.5 flex-shrink-0' />
                    <p className='text-sm text-yellow-800 font-medium'>{blockingMessage}</p>
                  </div>
                )
              )}
            </div>
          )}

          {isAccepted && (
            <div className='flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
              <CheckCircle2 className='w-4 h-4 text-green-600 flex-shrink-0 mt-0.5' />
              <p className='text-xs text-green-800'>
                {translatedText('This offer has been accepted!', 'تم قبول هذا العرض!')}
              </p>
            </div>
          )}

          {isDeclined && (
            <div className='flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
              <X className='w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5' />
              <p className='text-xs text-gray-600'>
                {translatedText('This offer was declined', 'تم رفض هذا العرض')}
              </p>
            </div>
          )}

          {isHostInConversation && isPending && (
            <div className='text-xs text-center text-gray-500 pt-2 border-t border-gray-200'>
              {translatedText("Waiting for traveler's response", 'في انتظار رد المسافر')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar for received messages */}
      {!isUser && (
        <div className='h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center mt-0.5 flex-shrink-0'>
          <div className='h-1.5 w-1.5 rounded-full bg-slate-400' />
        </div>
      )}

      <div className={cn('max-w-[85%]', isUser && 'flex flex-col items-end')}>
        {/* Message Content */}
        {displayText && (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 shadow-md',
              isUser ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-gray-900'
            )}
          >
            {isUser ? (
              <p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>
                {displayText}
              </p>
            ) : (
              <div
                className={cn(
                  'text-sm prose prose-sm max-w-none',
                  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
                  'prose-headings:text-gray-900 prose-p:text-gray-800',
                  'prose-a:text-purple-600 hover:prose-a:text-purple-700',
                  'prose-strong:text-gray-900 prose-code:text-purple-700'
                )}
              >
                <ReactMarkdown
                  components={{
                  code: ({ inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className='relative group/code my-2'>
                        <pre className='bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto'>
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                        <Button
                          size='icon'
                          variant='ghost'
                          className='absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/code:opacity-100 bg-gray-800 hover:bg-gray-700 transition-opacity'
                          onClick={() => {
                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                            toast.success('Code copied!', { duration: 2000 });
                          }}
                        >
                          <Copy className='h-3.5 w-3.5 text-gray-300' />
                        </Button>
                      </div>
                    ) : (
                      <code className='px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-mono'>
                        {children}
                      </code>
                    );
                  },
                  a: ({ children, ...props }) => (
                    <a {...props} target='_blank' rel='noopener noreferrer' className='underline'>
                      {children}
                    </a>
                  ),
                  p: ({ children }) => <p className='my-1 leading-relaxed'>{children}</p>,
                  ul: ({ children }) => (
                    <ul className='my-2 ml-4 list-disc space-y-1'>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className='my-2 ml-4 list-decimal space-y-1'>{children}</ol>
                  ),
                  li: ({ children }) => <li className='text-sm'>{children}</li>,
                  h1: ({ children }) => <h1 className='text-lg font-bold my-2'>{children}</h1>,
                  h2: ({ children }) => <h2 className='text-base font-bold my-2'>{children}</h2>,
                  h3: ({ children }) => <h3 className='text-sm font-semibold my-2'>{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className='border-l-3 border-purple-400 pl-3 my-2 text-gray-700 italic'>
                      {children}
                    </blockquote>
                  ),
                }}
                >
                  {displayText}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Tool Calls / Functions */}
        {message.tool_calls?.length > 0 && (
          <div className='space-y-1 mt-1'>
            {message.tool_calls.map((toolCall, idx) => (
              <FunctionDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Offer Card */}
        {hasOffer && renderOfferCard(offerData)}

        {/* Timestamp */}
        <div
          className={cn('text-[10px] text-gray-400 mt-1 px-1', isUser ? 'text-right' : 'text-left')}
        >
          {format(new Date(message.created_date), 'HH:mm')}
        </div>
      </div>
    </div>
  );
}
