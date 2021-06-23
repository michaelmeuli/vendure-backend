import { LanguageCode } from '@vendure/common/lib/generated-types';
import { ShippingCalculator } from '@vendure/core';

enum TaxSetting {
    include = 'include',
    exclude = 'exclude',
}

export const shippingCalculator = new ShippingCalculator({
    code: 'shipping-calculator',
    description: [{ languageCode: LanguageCode.en, value: 'Flat-Rate Shipping Calculator' }],
    args: {
        rate: {
            type: 'int',
            defaultValue: 0,
            ui: { component: 'currency-form-input' },
            label: [{ languageCode: LanguageCode.en, value: 'Shipping price' }],
        },
        includesTax: {
            type: 'string',
            defaultValue: TaxSetting.include,
            ui: {
                component: 'select-form-input',
                options: [
                    {
                        label: [{ languageCode: LanguageCode.en, value: 'Includes tax' }],
                        value: TaxSetting.include,
                    },
                    {
                        label: [{ languageCode: LanguageCode.en, value: 'Excludes tax' }],
                        value: TaxSetting.exclude,
                    },
                ],
            },
            label: [{ languageCode: LanguageCode.en, value: 'Price includes tax' }],
        },
        taxRate: {
            type: 'float',
            defaultValue: 0,
            ui: { component: 'number-form-input', suffix: '%' },
            label: [{ languageCode: LanguageCode.en, value: 'Tax rate' }],
        },
    },
    calculate: (ctx, order, args) => {
        return {
            price: args.rate,
            taxRate: args.taxRate,
            priceIncludesTax: getPriceIncludesTax(args.includesTax as any),
        };
    },
});

function getPriceIncludesTax(setting: TaxSetting): boolean {
    switch (setting) {
        case TaxSetting.exclude:
            return false;
        case TaxSetting.include:
            return true;
    }
}
