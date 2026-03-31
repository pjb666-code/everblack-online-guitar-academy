import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsCallerAdmin, useIsStripeConfigured, useSetStripeConfiguration } from '../../hooks/useQueries';
import { toast } from 'sonner';

const STRIPE_SETUP_DISMISSED_KEY = 'stripe-setup-dismissed';

export default function StripeSetupModal() {
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: isConfigured, isLoading } = useIsStripeConfigured();
  const setConfig = useSetStripeConfiguration();
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB');
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if the modal was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(STRIPE_SETUP_DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Reset dismissed state when Stripe is configured
  useEffect(() => {
    if (isConfigured) {
      localStorage.removeItem(STRIPE_SETUP_DISMISSED_KEY);
      setIsDismissed(false);
    }
  }, [isConfigured]);

  const showSetup = isAdmin && !isLoading && isConfigured === false && !isDismissed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      toast.error('Please enter your Stripe secret key');
      return;
    }

    try {
      await setConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries: countries.split(',').map((c) => c.trim()),
      });
      toast.success('Stripe configured successfully!');
      localStorage.removeItem(STRIPE_SETUP_DISMISSED_KEY);
      setIsDismissed(false);
    } catch (error) {
      toast.error('Failed to configure Stripe');
      console.error(error);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STRIPE_SETUP_DISMISSED_KEY, 'true');
    setIsDismissed(true);
    toast.info('You can configure Stripe later from the Admin Panel');
  };

  return (
    <Dialog open={showSetup} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Stripe Payment</DialogTitle>
          <DialogDescription>
            Set up Stripe to enable membership purchases. You can also configure this later in the Admin Panel.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretKey">Stripe Secret Key</Label>
            <Input
              id="secretKey"
              type="password"
              placeholder="sk_test_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="countries">Allowed Countries (comma-separated)</Label>
            <Input
              id="countries"
              placeholder="US,CA,GB"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={setConfig.isPending}>
              {setConfig.isPending ? 'Configuring...' : 'Configure Stripe'}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={handleSkip}>
              Skip for now
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
