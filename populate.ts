/* eslint-disable @typescript-eslint/no-var-requires */
import { bootstrap, defaultConfig, mergeConfig } from '@vendure/core';
import { populate } from '@vendure/core/cli';
import { clearAllTables, populateCustomers } from '@vendure/testing';
import { config } from './src/vendure-config';
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';

import { initialData } from './data/yl-initial-data';

// tslint:disable:no-console

/**
 * A CLI script which populates the database with some sample data
 */
if (require.main === module) {
    // Running from command line
    const populateConfig = mergeConfig(
        defaultConfig,
        mergeConfig(config, {
            authOptions: {
                tokenMethod: 'bearer',
                requireVerification: false,
            },
            importExportOptions: {
                importAssetsDir: 'data/images',
            },
            customFields: {},
            plugins: config.plugins!.filter(plugin => plugin !== AdminUiPlugin),
        }),
    );
    clearAllTables(populateConfig, true)
        .then(() =>
            populate(
                () => bootstrap(populateConfig),
                initialData,
                'data/products.csv'
            ),
        )
        .then(async app => {
            console.log('populating customers...');
            await populateCustomers(3, populateConfig, true);
            return app.close();
        })
        .then(
            () => process.exit(0),
            err => {
                console.log(err);
                process.exit(1);
            },
        );
}

