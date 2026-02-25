import { Router, Request, Response } from 'express';
import stripe from '../config/stripe';

const router = Router();

const PACKAGE_PRICES: { [key: string]: number } = {
    daily: 500,
    weekly: 2500,
    monthly: 8000,
};

router.post('/create-checkout-session', async (req: Request, res: Response) => {
    const { packageType, userId } = req.body;

    console.log('Checkout request received:', { packageType, userId });

    if (!packageType) {
        return res.status(400).json({ error: 'Package type is required' });
    }

    if (!PACKAGE_PRICES[packageType]) {
        return res.status(400).json({ error: `Invalid package type: ${packageType}. Valid types are: daily, weekly, monthly` });
    }

    try {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('STRIPE_SECRET_KEY is not configured');
            return res.status(500).json({ error: 'Server configuration error: Stripe keys missing' });
        }

        const productName = `${packageType.charAt(0).toUpperCase() + packageType.slice(1)} Subscription`;
        const origin = req.headers.origin || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: productName },
                        unit_amount: PACKAGE_PRICES[packageType],
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/subscription/cancel`,
            metadata: { userId: userId || 'unknown', packageType },
        });

        console.log('Stripe session created successfully:', session.id);
        res.json({ url: session.url });
    } catch (error: any) {
        console.error('Stripe error details:', error);
        res.status(500).json({
            error: 'Payment processing failed',
            details: error.message,
        });
    }
});

router.get('/verify-session', async (req: Request, res: Response) => {
    const { session_id } = req.query;

    if (!session_id) {
        return res.status(400).json({ error: 'Session ID is required' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id as string);
        if (session.payment_status === 'paid') {
            const userId = session.metadata?.userId;
            const packageType = session.metadata?.packageType;

            if (userId && userId !== 'unknown') {
                // Import User model and update
                const { User } = require('../models/User');
                await User.findOneAndUpdate(
                    { id: userId },
                    { isSubscribed: true, subscriptionType: packageType },
                    { new: true }
                );
            }

            res.json({ success: true, packageType });
        } else {
            res.status(400).json({ success: false, error: 'Payment not completed' });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Verification failed', details: error.message });
    }
});

router.get('/test', (req: Request, res: Response) => {
    res.json({ success: true, message: 'Stripe route is working!' });
});

export default router;
