import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export const PLANS = {
  starter: {
    name:    'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    amount:  900, // centavos = $9
  },
  pro: {
    name:    'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    amount:  1900, // centavos = $19
  },
}

// Cria sessão de checkout
export async function createCheckout(
  priceId: string,
  clerkUserId: string,
  userEmail: string
) {
  return stripe.checkout.sessions.create({
    mode:               'subscription',
    payment_method_types: ['card'],
    customer_email:     userEmail,
    line_items:         [{ price: priceId, quantity: 1 }],
    metadata:           { clerkUserId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?upgraded=true`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
  })
}

// Cria portal de billing (gerenciar assinatura)
export async function createPortal(stripeCustomerId: string) {
  return stripe.billingPortal.sessions.create({
    customer:   stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/conta/fatura`,
  })
}
