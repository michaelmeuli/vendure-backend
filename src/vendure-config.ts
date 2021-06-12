import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSearchPlugin,
    VendureConfig,
} from '@vendure/core';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import path from 'path';

import fs from 'fs';
import { BraintreePlugin } from './plugins/braintree/braintree-plugin';
import { SwissQrInvoicePlugin } from './plugins/swiss-qr-invoice/swiss-qr-invoice-plugin';

export const config: VendureConfig = {
    apiOptions: {
        port: 3000,
        adminApiPath: 'admin-api',
        adminApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        },// turn this off for production
        adminApiDebug: true, // turn this off for production
        shopApiPath: 'shop-api',
        shopApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        },// turn this off for production
        shopApiDebug: true,// turn this off for production
    },
    authOptions: {
        superadminCredentials: {
            identifier: <string>process.env.SUPERADMIN_IDENTIFIER,
            password: <string>process.env.SUPERADMIN_PASSWORD,
        },
    },
    dbConnectionOptions: {
        type: 'postgres',
        synchronize: true, // turn this off for production
        logging: false,
        database: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: <string>process.env.DB_PASSWORD,
        migrations: [getMigrationsPath()],
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    customFields: {},
    plugins: [
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, '../static/assets'),
        }),
        DefaultJobQueuePlugin,
        DefaultSearchPlugin,
        EmailPlugin.init({
            handlers: defaultEmailHandlers,
            templatePath: path.join(__dirname, '../static/email/templates'),
            globalTemplateVars: {
                // The following variables will change depending on your storefront implementation
                fromAddress: '"Yoga Lichtquelle" <no-reply@yoga-lichtquelle.ch>',
                verifyEmailAddressUrl: 'http://localhost:4201/account/verify',
                passwordResetUrl: 'http://localhost:4201/account/reset-password',
                changeEmailAddressUrl: 'http://localhost:4201/account/change-email-address'
            },
            transport: {
                type: 'smtp',
                host: 'smtp.sendgrid.net',
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: <string>process.env.SMTP_USER,
                    pass: <string>process.env.SMTP_PASSWORD
                }
            }
        }),
        AdminUiPlugin.init({
            route: 'admin',
            port: 3002,
        }),
        BraintreePlugin,
        SwissQrInvoicePlugin
    ]
};

function getMigrationsPath() {
    const devMigrationsPath = path.join(__dirname, '../migrations');
    const distMigrationsPath = path.join(__dirname, 'migrations');

    return fs.existsSync(distMigrationsPath)
        ? path.join(distMigrationsPath, '*.js')
        : path.join(devMigrationsPath, '*.ts');
}
