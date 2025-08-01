import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const MyAuraPreset = definePreset(Aura, {
  semantic: {
    primary: {
      0: '#000000',
      50: '{surface.50}',
      100: '{surface.100}',
      200: '{surface.200}',
      300: '{surface.300}',
      400: '{surface.400}',
      500: '{surface.500}',
      600: '{surface.600}',
      700: '{surface.700}',
      800: '{surface.800}',
      900: '{surface.900}',
      950: '{surface.950}',
    },
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
        }
      },
      dark: {
        surface: {
          0: '#fffffff',
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
          950: '{zinc.0}',
        },
      },
    },
  },
  components: {
    dialog: {
      colorScheme: {
        light: {
            root: {
              color: '{surface.600}',
              borderColor: '{transparent}',
            },
          },
          dark: {
            root: {
              background: '{zinc.900}',
              color: '{surface.600}',
              borderColor: '{transparent}',
            },
          }
        }
      },
      select: {
        colorScheme: {
          light: {
            overlay: {
              background: '{surface.0}',
            },
            option: {
              focusBackground: '{surface.200}',
            },
          },
          dark: {
            overlay: {
              background: '{surface.50}',
            },
            option: {
              focusBackground: '{surface.200}',          
            }
          }
        }
      },
      paginator: {
        colorScheme: {
          light: {
            root: {
              background: '{transparent}',
              color: '{surface.600}'
            },
          },
          dark: {
            root: {
              background: '{transparent}',
              color: '{surface.600}'
            },
          }
        }
      },
      popover: {
        colorScheme: {
          dark: {
            root: {
              background: '{zinc.900}',
              borderColor: '{zinc.800}',
            },
          }
        }
      },
    }
  }
);

export default MyAuraPreset
