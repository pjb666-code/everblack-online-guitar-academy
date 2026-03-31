import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, TrendingUp, Users, Check, Loader2 } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateCheckoutSession, useIsStripeConfigured, useGetHomepageContent } from '../hooks/useQueries';
import { MembershipTier, ShoppingItem } from '../backend';
import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from '../lib/translations';

export default function HomePage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const createCheckoutSession = useCreateCheckoutSession();
  const { data: isStripeConfigured } = useIsStripeConfigured();
  const { data: homepageContent, isLoading: isLoadingContent, error: contentError } = useGetHomepageContent();
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const { t, language } = useTranslation();

  // Determine if we should use English or German based on current language
  const isGerman = language === 'de';

  // Default features if no homepage content is available
  const defaultFeatures = [
    {
      icon: BookOpen,
      title: t('home.features.structuredLessons.title'),
      description: t('home.features.structuredLessons.description'),
    },
    {
      icon: TrendingUp,
      title: t('home.features.trackProgress.title'),
      description: t('home.features.trackProgress.description'),
    },
    {
      icon: Users,
      title: t('home.features.expertCoaching.title'),
      description: t('home.features.expertCoaching.description'),
    },
  ];

  // Default membership tiers if no homepage content is available
  const defaultMembershipTiers = [
    {
      name: t('home.membership.free.name'),
      tier: MembershipTier.free,
      price: '€0',
      priceInCents: 0,
      description: t('home.membership.free.description'),
      features: [
        t('home.membership.free.feature1'),
        t('home.membership.free.feature2'),
        t('home.membership.free.feature3'),
      ],
    },
    {
      name: t('home.membership.starter.name'),
      tier: MembershipTier.starter,
      price: '€19',
      priceInCents: 1900,
      description: t('home.membership.starter.description'),
      features: [
        t('home.membership.starter.feature1'),
        t('home.membership.starter.feature2'),
        t('home.membership.starter.feature3'),
        t('home.membership.starter.feature4'),
      ],
      popular: true,
    },
    {
      name: t('home.membership.pro.name'),
      tier: MembershipTier.pro,
      price: '€49',
      priceInCents: 4900,
      description: t('home.membership.pro.description'),
      features: [
        t('home.membership.pro.feature1'),
        t('home.membership.pro.feature2'),
        t('home.membership.pro.feature3'),
        t('home.membership.pro.feature4'),
      ],
    },
    {
      name: t('home.membership.coaching.name'),
      tier: MembershipTier.coaching,
      price: '€99',
      priceInCents: 9900,
      description: t('home.membership.coaching.description'),
      features: [
        t('home.membership.coaching.feature1'),
        t('home.membership.coaching.feature2'),
        t('home.membership.coaching.feature3'),
        t('home.membership.coaching.feature4'),
      ],
    },
  ];

  // Use homepage content from backend if available, otherwise use defaults
  const heroText = homepageContent 
    ? (isGerman ? homepageContent.heroTextDe : homepageContent.heroTextEn)
    : t('home.hero.title1') + ' ' + t('home.hero.title2') + ' ' + t('home.hero.title3');

  const whyChooseTitle = homepageContent?.whyChooseSection
    ? (isGerman ? homepageContent.whyChooseSection.titleDe : homepageContent.whyChooseSection.titleEn)
    : t('home.features.title');

  const whyChooseDescription = homepageContent?.whyChooseSection
    ? (isGerman ? homepageContent.whyChooseSection.descriptionDe : homepageContent.whyChooseSection.descriptionEn)
    : t('home.features.subtitle');

  const features = (homepageContent?.whyChooseSection?.featureCards && homepageContent.whyChooseSection.featureCards.length > 0)
    ? homepageContent.whyChooseSection.featureCards.map(card => ({
        icon: card.icon ? undefined : BookOpen,
        iconUrl: card.icon?.getDirectURL(),
        title: isGerman ? card.titleDe : card.titleEn,
        description: isGerman ? card.descriptionDe : card.descriptionEn,
      }))
    : defaultFeatures;

  const pricingTitle = homepageContent?.chooseYourPathSection
    ? (isGerman ? homepageContent.chooseYourPathSection.titleDe : homepageContent.chooseYourPathSection.titleEn)
    : t('home.membership.title');

  const pricingDescription = homepageContent?.chooseYourPathSection
    ? (isGerman ? homepageContent.chooseYourPathSection.descriptionDe : homepageContent.chooseYourPathSection.descriptionEn)
    : t('home.membership.subtitle');

  const membershipTiers = (homepageContent?.chooseYourPathSection?.pricingOptions && homepageContent.chooseYourPathSection.pricingOptions.length > 0)
    ? homepageContent.chooseYourPathSection.pricingOptions.map(option => ({
        name: isGerman ? option.nameDe : option.nameEn,
        tier: option.membershipTier,
        price: `€${Number(option.priceEur)}`,
        priceInCents: Number(option.priceEur) * 100,
        description: isGerman ? option.descriptionDe : option.descriptionEn,
        features: [], // Features would need to be added to the backend model if needed
        popular: option.membershipTier === MembershipTier.starter,
      }))
    : defaultMembershipTiers;

  const handleGetStarted = async (tier: typeof membershipTiers[0]) => {
    if (!isAuthenticated) {
      toast.error(t('toast.loginRequired'));
      return;
    }

    if (tier.priceInCents === 0) {
      // Free tier - just navigate to lessons
      window.location.href = '/lessons';
      return;
    }

    if (!isStripeConfigured) {
      toast.error(t('toast.paymentsUnavailable'));
      return;
    }

    setProcessingTier(tier.name);

    try {
      const items: ShoppingItem[] = [{
        productName: `Everblack Music - ${tier.name} Membership`,
        productDescription: tier.description,
        priceInCents: BigInt(tier.priceInCents),
        quantity: BigInt(1),
        currency: 'eur',
      }];

      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;

      const session = await createCheckoutSession.mutateAsync({
        items,
        successUrl,
        cancelUrl,
      });

      if (!session || !session.url) {
        throw new Error('Invalid checkout session response');
      }

      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`${t('toast.checkoutError')}: ${errorMessage}`);
      setProcessingTier(null);
    }
  };

  if (contentError) {
    console.error('Error loading homepage content:', contentError);
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {isLoadingContent ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-muted-foreground">{t('common.loading')}</span>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                    {heroText.split(' ').slice(0, 2).join(' ')}{' '}
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {heroText.split(' ').slice(2, 4).join(' ')}
                    </span>{' '}
                    {heroText.split(' ').slice(4).join(' ')}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {t('home.hero.description')}
                  </p>
                </>
              )}
              <div className="flex flex-wrap gap-4">
                {isAuthenticated ? (
                  <Button asChild size="lg">
                    <Link to="/lessons">{t('home.hero.browseLessons')}</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg">
                    <Link to="/lessons">{t('home.hero.getStarted')}</Link>
                  </Button>
                )}
                <Button asChild variant="outline" size="lg">
                  <a href="#membership">{t('home.hero.viewPricing')}</a>
                </Button>
              </div>
            </div>
            <div className="relative">
              {homepageContent?.heroImage ? (
                <img
                  src={homepageContent.heroImage.getDirectURL()}
                  alt="Hero"
                  className="rounded-lg shadow-2xl"
                />
              ) : (
                <img
                  src="/assets/generated/hero-guitars.dim_1200x400.png"
                  alt="Guitars"
                  className="rounded-lg shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            {isLoadingContent ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {whyChooseTitle}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {whyChooseDescription}
                </p>
              </>
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  {feature.iconUrl ? (
                    <img 
                      src={feature.iconUrl} 
                      alt={feature.title}
                      className="h-12 w-12 mb-4 object-contain"
                    />
                  ) : feature.icon ? (
                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                  ) : null}
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section id="membership" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            {isLoadingContent ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {pricingTitle}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {pricingDescription}
                </p>
              </>
            )}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {membershipTiers.map((tier, index) => (
              <Card
                key={index}
                className={`relative ${tier.popular ? 'border-primary border-2 shadow-lg' : ''}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {t('home.membership.mostPopular')}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    {tier.price}
                    <span className="text-sm font-normal text-muted-foreground">{t('home.membership.perMonth')}</span>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {tier.features && tier.features.length > 0 && (
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start">
                          <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? 'default' : 'outline'}
                    onClick={() => handleGetStarted(tier)}
                    disabled={processingTier === tier.name}
                  >
                    {processingTier === tier.name 
                      ? t('home.membership.processing')
                      : tier.priceInCents === 0 
                        ? t('home.membership.getStarted')
                        : t('home.membership.buyNow')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/20 to-accent/20">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('home.cta.title')}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('home.cta.subtitle')}
          </p>
          <Button asChild size="lg">
            <Link to="/lessons">{t('home.cta.button')}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
