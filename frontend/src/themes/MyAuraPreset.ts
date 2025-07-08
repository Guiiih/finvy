import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const MyAuraPreset = definePreset(Aura, {
    semantic: {
        colorScheme: {
            light: {
                surface: {
                    50: '{gray.50}',
                    100: '{gray.100}',
                    200: '{gray.200}',
                    300: '{gray.300}',
                    400: '{gray.400}',
                    500: '{gray.500}',
                    600: '{gray.600}',
                    700: '{gray.700}',
                    800: '{gray.800}',
                    900: '{gray.900}',
                    950: '{gray.950}'
                },
                primary: {
                    50: '{emerald.50}',
                    100: '{emerald.100}',
                    200: '{emerald.200}',
                    300: '{emerald.300}',
                    400: '{emerald.400}',
                    500: '{emerald.500}',
                    600: '{emerald.600}',
                    700: '{emerald.700}',
                    800: '{emerald.800}',
                    900: '{emerald.900}',
                    950: '{emerald.950}'
                },
            },
            dark: {
                surface: {
                    50: '{zinc.900}',
                    100: '{zinc.800}',
                    200: '{zinc.700}',
                    300: '{zinc.600}',
                    400: '{zinc.500}',
                    500: '{zinc.400}',
                    600: '{zinc.300}',
                    700: '{zinc.200}',
                    800: '{zinc.100}',
                    900: '{zinc.50}',
                    950: '{zinc.0}'
                },
                primary: {
                    50: '{emerald.950}',
                    100: '{emerald.900}',
                    200: '{emerald.800}',
                    300: '{emerald.700}',
                    400: '{emerald.600}',
                    500: '{emerald.500}',
                    600: '{emerald.400}',
                    700: '{emerald.300}',
                    800: '{emerald.200}',
                    900: '{emerald.100}',
                    950: '{emerald.50}'
                },
            }
        }
    }
});

export default MyAuraPreset;
