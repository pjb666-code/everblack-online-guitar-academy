import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  return (
    <div className="container py-12 flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
          <CardDescription>We couldn't process your payment.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your payment was not successful. Please try again or contact support if the problem persists.
          </p>
          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link to="/">Try Again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/lessons">Browse Free Lessons</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
