import {
    AccountRegistrationEvent,
    IdentifierChangeRequestEvent,
    NativeAuthenticationMethod,
    OrderStateTransitionEvent,
    PasswordResetEvent,
    ShippingMethod,
    TransactionalConnection,
    PaymentStateTransitionEvent,
} from '@vendure/core';

import { EmailEventHandler } from '@vendure/email-plugin';
import { EmailEventListener } from '@vendure/email-plugin';

const SwissQRBill = require('swissqrbill');

export const sendInvoiceHandler = new EmailEventListener('send-invoice')
    .on(PaymentStateTransitionEvent)
    .filter(event => event.toState === 'Authorized' && event.payment.method === 'swissqrinvoice') // this.code in payment-method-handler.ts via super(config) (config: PaymentMethodConfigOptions<T>) (interface PaymentMethodConfigOptions<T extends ConfigArgs> extends ConfigurableOperationDefOptions<T>)
    .setAttachments(async event => {
        const data = {
            currency: 'CHF',
            amount: event.order.totalWithTax,
            additionalInformation: event.order.code,
            creditor: {
                name: 'SwissQRBill',
                address: 'Bahnhofstrasse 7',
                zip: 1234,
                city: 'Musterstadt',
                account: 'CH4431999123000889012',
                country: 'CH',
            },
            debtor: {
                name: event.order.customer?.firstName.concat(' ', event.order.customer?.lastName),
                address: event.order.customer?.addresses[0].streetLine1,
                zip: event.order.customer?.addresses[0].postalCode,
                city: event.order.customer?.addresses[0].city,
                country: event.order.customer?.addresses[0].country,
            },
        };

        const pdf = new SwissQRBill.PDF(data, 'complete-qr-bill.pdf', { autoGenerate: false, size: 'A4' });

        //-- Add creditor address

        pdf.fontSize(12);
        pdf.fillColor('black');
        pdf.font('Helvetica');
        pdf.text(
            data.creditor.name +
                '\n' +
                data.creditor.address +
                '\n' +
                data.creditor.zip +
                ' ' +
                data.creditor.city,
            SwissQRBill.utils.mmToPoints(20),
            SwissQRBill.utils.mmToPoints(35),
            {
                width: SwissQRBill.utils.mmToPoints(100),
                height: SwissQRBill.utils.mmToPoints(50),
                align: 'left',
            },
        );

        //-- Add debtor address

        pdf.fontSize(12);
        pdf.font('Helvetica');
        pdf.text(
            data.debtor.name + '\n' + data.debtor.address + '\n' + data.debtor.zip + ' ' + data.debtor.city,
            SwissQRBill.utils.mmToPoints(130),
            SwissQRBill.utils.mmToPoints(60),
            {
                width: SwissQRBill.utils.mmToPoints(70),
                height: SwissQRBill.utils.mmToPoints(50),
                align: 'left',
            },
        );

        //-- Add title

        pdf.fontSize(14);
        pdf.font('Helvetica-Bold');
        pdf.text(
            'Rechnung Nr. 1071672',
            SwissQRBill.utils.mmToPoints(20),
            SwissQRBill.utils.mmToPoints(100),
            {
                width: SwissQRBill.utils.mmToPoints(170),
                align: 'left',
            },
        );

        const date = new Date();

        pdf.fontSize(11);
        pdf.font('Helvetica');
        pdf.text('Musterstadt ' + date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear(), {
            width: SwissQRBill.utils.mmToPoints(170),
            align: 'right',
        });

        //-- Add table

        const table = {
            width: SwissQRBill.utils.mmToPoints(170),
            rows: [
                {
                    height: 30,
                    fillColor: '#ECF0F1',
                    columns: [
                        {
                            text: 'Position',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: 'Anzahl',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: 'Bezeichnung',
                        },
                        {
                            text: 'Total',
                            width: SwissQRBill.utils.mmToPoints(30),
                        },
                    ],
                },
                {
                    columns: [
                        {
                            text: '1',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: '14 Std.',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: 'Programmierung SwissQRBill',
                        },
                        {
                            text: "CHF 1'540.00",
                            width: SwissQRBill.utils.mmToPoints(30),
                        },
                    ],
                },
                {
                    columns: [
                        {
                            text: '2',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: '8 Std.',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: 'Dokumentation',
                        },
                        {
                            text: 'CHF 880.00',
                            width: SwissQRBill.utils.mmToPoints(30),
                        },
                    ],
                },
                {
                    height: 40,
                    columns: [
                        {
                            text: '',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: '',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: 'Summe',
                            font: 'Helvetica-Bold',
                        },
                        {
                            text: "CHF 2'420.00",
                            font: 'Helvetica-Bold',
                            width: SwissQRBill.utils.mmToPoints(30),
                        },
                    ],
                },
                {
                    columns: [
                        {
                            text: '',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: '',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: 'MwSt.',
                        },
                        {
                            text: '7.7%',
                            width: SwissQRBill.utils.mmToPoints(30),
                        },
                    ],
                },
                {
                    columns: [
                        {
                            text: '',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: '',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: 'MwSt. Betrag',
                        },
                        {
                            text: 'CHF 186.35',
                            width: SwissQRBill.utils.mmToPoints(30),
                        },
                    ],
                },
                {
                    height: 40,
                    columns: [
                        {
                            text: '',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: '',
                            width: SwissQRBill.utils.mmToPoints(20),
                        },
                        {
                            text: 'Rechnungstotal',
                            font: 'Helvetica-Bold',
                        },
                        {
                            text: "CHF 2'606.35",
                            width: SwissQRBill.utils.mmToPoints(30),
                            font: 'Helvetica-Bold',
                        },
                    ],
                },
            ],
        };

        pdf.addTable(table);

        //-- Add QR slip

        pdf.addQRBill();

        //-- Finalize the document

        pdf.end();

        return [
            {
                filename: 'complete-qr-bill.pdf',
                path: pdf,
            },
        ];
    })
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom('"Yoga Lichtquelle" <no-reply@yoga-lichtquelle.ch>')
    .setSubject(`Rechnung für Bestellung #{{ order.code }}`)
    .setTemplateVars(event => ({ order: event.order }));

export const testAttachmentHandler = new EmailEventListener('send-invoice')
    .on(PaymentStateTransitionEvent)
    .filter(event => event.toState === 'Authorized' && event.payment.method === 'swissqrinvoice') // this.code in payment-method-handler.ts via super(config) (config: PaymentMethodConfigOptions<T>) (interface PaymentMethodConfigOptions<T extends ConfigArgs> extends ConfigurableOperationDefOptions<T>)
    .setAttachments(async event => {
        return [
            {
                filename: `Rechnung-${event.order.code}.pdf`,
                path: '/home/michael/Dokumente/Adresse.pdf',
            },
        ];
    })
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom('"Yoga Lichtquelle" <no-reply@yoga-lichtquelle.ch>')
    .setSubject(`Rechnung für Bestellung #{{ event.order.code }}`)
    .setTemplateVars(event => ({ order: event.order }));

export const sendInvoiceHandlers: Array<EmailEventHandler<any, any>> = [testAttachmentHandler];
