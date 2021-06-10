import {
    AccountRegistrationEvent,
    IdentifierChangeRequestEvent,
    NativeAuthenticationMethod,
    OrderStateTransitionEvent,
    PasswordResetEvent,
    ShippingMethod,
    TransactionalConnection,
    PaymentStateTransitionEvent
} from '@vendure/core';

import { EmailEventHandler } from '@vendure/email-plugin';
import { EmailEventListener } from '@vendure/email-plugin';


export const sendInvoiceHandler = new EmailEventListener('send-invoice')
    .on(PaymentStateTransitionEvent)
    .filter(
        event =>
            event.toState === 'Created' && event.payment.method === 'swiss-qr-invoice'  // this.code in payment-method-handler.ts via super(config) (config: PaymentMethodConfigOptions<T>) (interface PaymentMethodConfigOptions<T extends ConfigArgs> extends ConfigurableOperationDefOptions<T>) 
    )
    .loadData(async context => {
        const shippingMethods: ShippingMethod[] = [];  

        for (const line of context.event.order.shippingLines || []) {
            let shippingMethod: ShippingMethod | undefined;
            if (!line.shippingMethod && line.shippingMethodId) {
                shippingMethod = await context.injector
                    .get(TransactionalConnection)
                    .getRepository(ShippingMethod)
                    .findOne(line.shippingMethodId);
            } else if (line.shippingMethod) {
                shippingMethod = line.shippingMethod;
            }
            if (shippingMethod) {
                shippingMethods.push(shippingMethod);
            }
        }

        return { shippingMethods };
    })
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom(`{{ fromAddress }}`)
    .setSubject(`Order confirmation for #{{ order.code }}`)
    .setTemplateVars(event => ({ order: event.order, shippingMethods: event.data.shippingMethods }))
    .setMockEvent(mockOrderStateTransitionEvent);