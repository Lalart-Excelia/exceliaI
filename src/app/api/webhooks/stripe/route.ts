import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const clerkId = session.metadata?.clerkUserId
      if (!clerkId) break

      // Identifica o plano pelo priceId
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      const priceId   = lineItems.data[0]?.price?.id
      const plan      = priceId === process.env.STRIPE_STARTER_PRICE_ID ? 'starter' : 'pro'

      await supabaseAdmin.from('users').upsert({
        id:                     clerkId,
        plan,
        credits_used:           0,
        credits_reset_at:       new Date().toISOString(),
        stripe_customer_id:     session.customer as string,
        stripe_subscription_id: session.subscription as string,
      })

      // Registra compra
      await supabaseAdmin.from('purchases').insert({
        user_id:        clerkId,
        plan,
        stripe_session: session.id,
        amount:         session.amount_total,
      })
      break
    }

    case 'invoice.paid': {
      // Renova créditos mensalmente
      const invoice     = event.data.object
      const customerId  = invoice.customer as string
      const { data: user } = await supabaseAdmin
        .from('users').select('id').eq('stripe_customer_id', customerId).single()

      if (user) {
        await supabaseAdmin.from('users').update({
          credits_used:     0,
          credits_reset_at: new Date().toISOString(),
        }).eq('id', user.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      // Downgrade para free
      const sub        = event.data.object
      const { data: user } = await supabaseAdmin
        .from('users').select('id').eq('stripe_subscription_id', sub.id).single()

      if (user) {
        await supabaseAdmin.from('users').update({
          plan:                   'free',
          stripe_subscription_id: null,
          credits_used:           0,
        }).eq('id', user.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
